import type { Database } from '../db/database'
import type {
  MetadataAdapter,
  EnrichmentAdapter,
  NavidromeAdapter,
  AlbumStore,
} from './adapters'
import { GenreSet, resolveCoverArt, isSpotifySource } from './enrichment'
import {
  isEnabled,
  type LoadUserImportConfig,
  type UserImportConfig,
} from './user-config'

/** The job-store operations the pipeline relies on for progress tracking. */
export interface JobStore {
  createJob(): string
  updateJob(
    id: string,
    update: {
      status?: 'pending' | 'processing' | 'complete' | 'error'
      step?: string | null
      albumId?: string | null
      error?: string | null
      totalAlbums?: number | null
      processedAlbums?: number | null
    },
  ): void
  getJob(id: string):
    | {
        status: 'pending' | 'processing' | 'complete' | 'error'
        step: string | null
        albumId: string | null
        error: string | null
        totalAlbums: number | null
        processedAlbums: number | null
      }
    | undefined
}

/** Observable status of an import job. */
export interface ImportStatus {
  status: 'pending' | 'processing' | 'complete' | 'error'
  step: string | null
  albumId: string | null
  error: string | null
  totalAlbums: number | null
  processedAlbums: number | null
}

export interface ImportPipelineDeps {
  db: Database
  albums: AlbumStore
  metadata: MetadataAdapter
  enrichment: EnrichmentAdapter
  navidrome: NavidromeAdapter
  jobs: JobStore
  /** Reads/decrypts the user's import config. */
  loadConfig: LoadUserImportConfig
}

/**
 * The album import pipeline — a deep module behind a three-operation interface
 * (`importFromUrl`, `importPlaylist`, `status`). Everything about how imports
 * work — cover-art priority, Spotify genre suppression, numeric-genre cleanup,
 * MusicBrainz / Navidrome / Last.fm enrichment, transactional persistence — is
 * implementation detail hidden behind that interface.
 *
 * External fetchers arrive as adapters (accept dependencies, don't create
 * them); the `Database` handle is injected rather than imported, so multi-step
 * writes can run inside a single transaction and tests can wire fakes.
 */
export class ImportPipeline {
  private readonly db: Database
  private readonly albums: AlbumStore
  private readonly metadata: MetadataAdapter
  private readonly enrichment: EnrichmentAdapter
  private readonly navidrome: NavidromeAdapter
  private readonly jobs: JobStore
  private readonly loadConfig: LoadUserImportConfig

  constructor(deps: ImportPipelineDeps) {
    this.db = deps.db
    this.albums = deps.albums
    this.metadata = deps.metadata
    this.enrichment = deps.enrichment
    this.navidrome = deps.navidrome
    this.jobs = deps.jobs
    this.loadConfig = deps.loadConfig
  }

  /**
   * Import a single album/track URL. Returns a job id immediately; the import
   * runs in the background and progress is observable via `status`.
   */
  importFromUrl(url: string, userId: string): { jobId: string } {
    const jobId = this.jobs.createJob()
    void this.runImportJob(jobId, url, userId)
    return { jobId }
  }

  /**
   * Import a Spotify playlist. Returns a job id immediately; the import runs in
   * the background and progress is observable via `status`.
   */
  importPlaylist(playlistId: string, userId: string): { jobId: string } {
    const jobId = this.jobs.createJob()
    void this.runPlaylistImportJob(jobId, playlistId, userId)
    return { jobId }
  }

  /**
   * Search external services for candidate cover art for a given artist +
   * album, in preference order (Spotify, Last.fm, Navidrome, MusicBrainz).
   * Used by the manual artwork picker.
   */
  async findArtwork(
    artist: string,
    album: string,
    userId: string,
  ): Promise<Array<{ url: string; source: string }>> {
    const config = await this.loadConfig(this.db, userId)
    const enabled = config.enabledServices
    const results: Array<{ url: string; source: string }> = []

    // 1. Spotify (preferred — highest quality)
    if (
      isEnabled(enabled, 'spotify') &&
      process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET
    ) {
      const urls = await this.enrichment.searchSpotifyArtwork(artist, album)
      for (const url of urls) results.push({ url, source: 'spotify' })
    }

    // 2. Last.fm
    if (isEnabled(enabled, 'lastfm') && process.env.LASTFM_API_KEY) {
      const info = await this.enrichment.fetchLastFmAlbumInfo(artist, album)
      if (info?.coverUrl) results.push({ url: info.coverUrl, source: 'lastfm' })
    }

    // 3. Navidrome (if configured)
    if (isEnabled(enabled, 'navidrome') && config.navidrome) {
      const coverUrl = await this.navidrome.fetchCoverArtUrl(
        artist,
        album,
        config.navidrome,
      )
      if (coverUrl) results.push({ url: coverUrl, source: 'navidrome' })
    }

    // 4. MusicBrainz / Cover Art Archive (fallback)
    if (isEnabled(enabled, 'musicbrainz')) {
      const urls = await this.enrichment.searchMusicBrainzArtwork(artist, album)
      for (const url of urls) results.push({ url, source: 'musicbrainz' })
    }

    return results
  }

  /** Observe an import job's current status. */
  status(jobId: string): ImportStatus {
    const job = this.jobs.getJob(jobId)
    if (!job) {
      return {
        status: 'error',
        step: null,
        albumId: null,
        error: 'Job not found',
        totalAlbums: null,
        processedAlbums: null,
      }
    }
    return {
      status: job.status,
      step: job.step,
      albumId: job.albumId,
      error: job.error,
      totalAlbums: job.totalAlbums,
      processedAlbums: job.processedAlbums,
    }
  }

  // --- implementation -------------------------------------------------------

  private async runImportJob(
    jobId: string,
    url: string,
    userId: string,
  ): Promise<void> {
    try {
      this.jobs.updateJob(jobId, { status: 'processing', step: 'parsing' })

      const config = await this.loadConfig(this.db, userId)
      const enabled = config.enabledServices

      this.jobs.updateJob(jobId, { step: 'fetching_metadata' })
      const metadata = await this.metadata.fetchMetadata(url, config.navidrome)

      // Don't trust Spotify's genre metadata — it has poor tagging.
      const { kind } = this.metadata.parseUrl(url)
      const spotify = isSpotifySource(kind)
      if (spotify) metadata.genre = undefined

      this.jobs.updateJob(jobId, { step: 'fetching_artwork' })
      let lastFmCoverUrl: string | undefined
      let lastFmInfo:
        | Awaited<ReturnType<EnrichmentAdapter['fetchLastFmAlbumInfo']>>
        | undefined
      if (isEnabled(enabled, 'lastfm')) {
        lastFmInfo = await this.enrichment.fetchLastFmAlbumInfo(
          metadata.artist,
          metadata.title,
        )
        if (lastFmInfo?.mbid && !metadata.mbid) metadata.mbid = lastFmInfo.mbid
        lastFmCoverUrl = lastFmInfo?.coverUrl
      }
      let caaCover: string | undefined
      if (metadata.mbid) {
        caaCover = await this.enrichment.fetchCoverArtFromMbid(metadata.mbid)
      }
      metadata.coverUrl = resolveCoverArt({
        isSpotify: spotify,
        sourceCover: metadata.coverUrl,
        lastFmCover: lastFmCoverUrl,
        caaCover,
      })

      // Genre: additive merge from Navidrome, Last.fm, MusicBrainz (in
      // preference order), stopping once a service has contributed.
      const genres = new GenreSet(metadata.genre)
      let serviceContributed = false
      if (config.navidrome && isEnabled(enabled, 'navidrome')) {
        const navResult = await this.navidrome.fetchAlbumUrl(
          metadata.artist,
          metadata.title,
          config.navidrome,
        )
        if (navResult?.genre) {
          genres.add(navResult.genre)
          serviceContributed = genres.size > 0
        }
      }
      if (
        !serviceContributed &&
        isEnabled(enabled, 'lastfm') &&
        lastFmInfo?.genre
      ) {
        genres.add(lastFmInfo.genre)
        serviceContributed = genres.size > 0
      }
      if (!serviceContributed && isEnabled(enabled, 'musicbrainz')) {
        genres.add(
          await this.enrichment.fetchMusicBrainzGenres(
            metadata.artist,
            metadata.title,
          ),
        )
      }
      metadata.genre = genres.toValue()

      // Create-then-enrich-then-update in a single transaction so a mid-flight
      // failure leaves nothing persisted.
      const albumId = await this.albums.transaction(async (tx) => {
        this.jobs.updateJob(jobId, { step: 'saving' })
        const album = await tx.create(metadata, userId)

        this.jobs.updateJob(jobId, { step: 'fetching_links' })
        const linkUpdates = await this.collectLinkUpdates(
          album.artist,
          album.title,
          album.mbid,
          config,
        )

        if (Object.keys(linkUpdates).length > 0) {
          await tx.update(album.id, userId, linkUpdates)
        }

        return album.id
      })

      this.jobs.updateJob(jobId, {
        status: 'complete',
        step: 'complete',
        albumId,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred'
      this.jobs.updateJob(jobId, { status: 'error', error: message })
    }
  }

  private async runPlaylistImportJob(
    jobId: string,
    playlistId: string,
    userId: string,
  ): Promise<void> {
    try {
      this.jobs.updateJob(jobId, {
        status: 'processing',
        step: 'fetching_metadata',
      })

      const config = await this.loadConfig(this.db, userId)
      const enabled = config.enabledServices

      const albums = await this.metadata.fetchPlaylistAlbums(playlistId)
      if (albums.length === 0) {
        this.jobs.updateJob(jobId, {
          status: 'complete',
          step: 'complete',
          totalAlbums: 0,
          processedAlbums: 0,
        })
        return
      }

      this.jobs.updateJob(jobId, {
        totalAlbums: albums.length,
        processedAlbums: 0,
        step: 'saving',
      })

      const createdAlbumIds: string[] = []

      for (let i = 0; i < albums.length; i++) {
        const metadata = albums[i]
        const genres = new GenreSet(metadata.genre)

        if (config.navidrome && isEnabled(enabled, 'navidrome')) {
          const navResult = await this.navidrome.fetchAlbumUrl(
            metadata.artist,
            metadata.title,
            config.navidrome,
          )
          if (navResult?.genre) genres.add(navResult.genre)
        }

        if (genres.size === 0 && isEnabled(enabled, 'lastfm')) {
          const lastFm = await this.enrichment.fetchLastFmAlbumInfo(
            metadata.artist,
            metadata.title,
          )
          if (lastFm?.coverUrl) metadata.coverUrl = lastFm.coverUrl
          if (lastFm?.mbid) metadata.mbid = lastFm.mbid
          genres.add(lastFm?.genre)
        }

        if (genres.size === 0 && isEnabled(enabled, 'musicbrainz')) {
          genres.add(
            await this.enrichment.fetchMusicBrainzGenres(
              metadata.artist,
              metadata.title,
            ),
          )
        }

        const genreValue = genres.toValue()
        if (genreValue) metadata.genre = genreValue

        const created = await this.albums.insert({
          userId,
          title: metadata.title,
          artist: metadata.artist,
          releaseDate: metadata.releaseDate ?? null,
          coverUrl: metadata.coverUrl ?? null,
          mbid: metadata.mbid ?? null,
          genre: metadata.genre ?? null,
          ...(metadata.addedAt ? { createdAt: metadata.addedAt } : {}),
        })
        createdAlbumIds.push(created.id)

        this.jobs.updateJob(jobId, { processedAlbums: i + 1 })
      }

      this.jobs.updateJob(jobId, { status: 'complete', step: 'complete' })

      // Fire background enrichment for each created album — runs after the job
      // is marked complete.
      for (const albumId of createdAlbumIds) {
        void this.enrichAlbum(albumId, userId)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred'
      this.jobs.updateJob(jobId, { status: 'error', error: message })
    }
  }

  /**
   * Best-effort metadata enrichment for a single existing album. Silently skips
   * steps that fail or lack an MBID — safe to fire-and-forget. When
   * `skipArtwork` is set the cover image is left untouched (used by manual
   * refresh where the user may have chosen artwork).
   */
  async enrichAlbum(
    albumId: string,
    userId: string,
    skipArtwork = false,
  ): Promise<void> {
    try {
      const albumModule = this.albums
      const album = await albumModule.findById(albumId, userId)

      const config = await this.loadConfig(this.db, userId)
      const enabled = config.enabledServices

      const updates: Record<string, unknown> = {}
      let mbid = album.mbid

      // Navidrome resolves MBID and URL in one call.
      if (config.navidrome && isEnabled(enabled, 'navidrome')) {
        const navResult = await this.navidrome.fetchAlbumUrl(
          album.artist,
          album.title,
          config.navidrome,
        )
        if (navResult) {
          if (navResult.mbid && !mbid) {
            mbid = navResult.mbid
            updates.mbid = mbid
          }
          updates.urlNavidrome = navResult.relativeUrl
        }
      }

      if (!mbid) {
        if (Object.keys(updates).length > 0) {
          await albumModule.update(albumId, userId, updates)
        }
        return // No MBID — nothing more to do.
      }

      let lastFmCoverUrl: string | undefined
      if (isEnabled(enabled, 'lastfm')) {
        const lastFm = await this.enrichment.fetchLastFmAlbumInfo(
          album.artist,
          album.title,
        )
        if (lastFm?.urlLastFm) updates.urlLastFm = lastFm.urlLastFm
        lastFmCoverUrl = lastFm?.coverUrl
      }

      if (isEnabled(enabled, 'musicbrainz')) {
        if (!skipArtwork) {
          const caaCover = await this.enrichment.fetchCoverArtFromMbid(mbid)
          // Last.fm preferred over CAA.
          const newCover = lastFmCoverUrl ?? caaCover
          if (newCover) updates.coverUrl = newCover
        }

        const mb = await this.enrichment.enrichFromMusicBrainz(mbid)
        this.applyMusicBrainzLinks(updates, mb, enabled)
      }

      if (Object.keys(updates).length > 0) {
        await albumModule.update(albumId, userId, updates)
      }
    } catch {
      // Background enrichment — swallow errors silently.
    }
  }

  /**
   * Collect cross-service link updates (Last.fm, MusicBrainz relations,
   * Navidrome) for a freshly-created album.
   */
  private async collectLinkUpdates(
    artist: string,
    title: string,
    mbid: string | null,
    config: UserImportConfig,
  ): Promise<Record<string, string>> {
    const enabled = config.enabledServices
    const linkUpdates: Record<string, string> = {}

    if (isEnabled(enabled, 'lastfm')) {
      const lastFm = await this.enrichment.fetchLastFmAlbumInfo(artist, title)
      if (lastFm?.urlLastFm) linkUpdates.urlLastFm = lastFm.urlLastFm
    }

    if (mbid && isEnabled(enabled, 'musicbrainz')) {
      const mb = await this.enrichment.enrichFromMusicBrainz(mbid)
      this.applyMusicBrainzLinks(linkUpdates, mb, enabled)
    }

    if (config.navidrome && isEnabled(enabled, 'navidrome')) {
      const navResult = await this.navidrome.fetchAlbumUrl(
        artist,
        title,
        config.navidrome,
      )
      if (navResult) linkUpdates.urlNavidrome = navResult.relativeUrl
    }

    return linkUpdates
  }

  private applyMusicBrainzLinks(
    target: Record<string, unknown>,
    mb: Awaited<ReturnType<EnrichmentAdapter['enrichFromMusicBrainz']>>,
    enabled: string[],
  ): void {
    if (mb.urlSpotify && isEnabled(enabled, 'spotify'))
      target.urlSpotify = mb.urlSpotify
    if (mb.urlAppleMusic && isEnabled(enabled, 'applemusic'))
      target.urlAppleMusic = mb.urlAppleMusic
    if (mb.urlYoutube && isEnabled(enabled, 'youtube'))
      target.urlYoutube = mb.urlYoutube
    if (mb.urlYoutubeMusic && isEnabled(enabled, 'youtube'))
      target.urlYoutubeMusic = mb.urlYoutubeMusic
    if (mb.urlRateYourMusic && isEnabled(enabled, 'rateyourmusic'))
      target.urlRateYourMusic = mb.urlRateYourMusic
  }
}
