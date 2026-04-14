import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc/trpc'
import {
  createAlbumSchema,
  updateAlbumSchema,
  albumFilterSchema,
} from '../schemas/album.schema'
import { AlbumService } from '../services/album.service'
import { AlbumRepository } from '../repositories/album.repository'
import { createJob, updateJob, getJob } from '../services/job-store'
import {
  fetchMetadata,
  fetchLastFmAlbumInfo,
  fetchCoverArtFromMbid,
  fetchSpotifyPlaylistAlbums,
  searchSpotifyArtwork,
  searchSpotifyGenres,
  searchAppleMusicGenre,
  parseUrl,
} from '../services/url-import.service'
import { eq } from 'drizzle-orm'
import {
  enrichFromMusicBrainz,
  searchMusicBrainzArtwork,
  fetchMusicBrainzGenres,
} from '../services/musicbrainz.service'
import {
  fetchNavidromeAlbumUrl,
  fetchNavidromeCoverArtUrl,
} from '../services/navidrome.service'
import { decrypt } from '../services/encryption.service'
import { userConfig } from '../db/schema/navidrome.schema'
import { db } from '../db/database'
import type { Database } from '../db/database'

function isEnabled(enabledServices: string[], key: string): boolean {
  return enabledServices.length === 0 || enabledServices.includes(key)
}

async function runImportJob(
  jobId: string,
  url: string,
  userId: string,
): Promise<void> {
  try {
    updateJob(jobId, { status: 'processing', step: 'parsing' })

    // Fetch user config once — used for enabled services and navidrome credentials
    const [configRow] = await db
      .select()
      .from(userConfig)
      .where(eq(userConfig.userId, userId))
      .limit(1)
    const enabled = configRow?.enabledExternalServices ?? []

    updateJob(jobId, { step: 'fetching_metadata' })
    const navidromeConfig =
      configRow?.navidromeUrl && isEnabled(enabled, 'navidrome')
        ? {
            url: configRow.navidromeUrl,
            username: configRow.navidromeUsername!,
            password: decrypt(configRow.navidromePassword!),
          }
        : undefined
    const metadata = await fetchMetadata(url, navidromeConfig)

    updateJob(jobId, { step: 'fetching_artwork' })
    let lastFmCoverUrl: string | undefined
    let lastFmInfo: Awaited<ReturnType<typeof fetchLastFmAlbumInfo>> | undefined
    if (isEnabled(enabled, 'lastfm')) {
      lastFmInfo = await fetchLastFmAlbumInfo(metadata.artist, metadata.title)
      if (lastFmInfo?.mbid && !metadata.mbid) metadata.mbid = lastFmInfo.mbid
      lastFmCoverUrl = lastFmInfo?.coverUrl
    }
    let caaCover: string | undefined
    if (metadata.mbid) {
      caaCover = await fetchCoverArtFromMbid(metadata.mbid)
    }
    // Priority: Spotify image (preferred) > LastFM > CAA > YouTube thumbnail (last resort)
    const { kind } = parseUrl(url)
    if (kind === 'spotify_album' || kind === 'spotify_track') {
      metadata.coverUrl = metadata.coverUrl ?? lastFmCoverUrl ?? caaCover
    } else {
      metadata.coverUrl = lastFmCoverUrl ?? caaCover ?? metadata.coverUrl
    }

    // Genre fallback chain (import only — enrichAlbum never updates genre)
    // Step 1: genre from URL import source (already in metadata.genre if Spotify/Apple Music)
    // Step 2: Navidrome
    if (!metadata.genre && navidromeConfig && isEnabled(enabled, 'navidrome')) {
      const navResult = await fetchNavidromeAlbumUrl(
        metadata.artist,
        metadata.title,
        navidromeConfig,
      )
      if (navResult?.genre) metadata.genre = navResult.genre
    }
    // Step 3: opposite service
    if (!metadata.genre) {
      if (
        (kind === 'spotify_album' || kind === 'spotify_track') &&
        isEnabled(enabled, 'applemusic')
      ) {
        metadata.genre = await searchAppleMusicGenre(metadata.artist, metadata.title)
      } else if (
        kind === 'apple_music' &&
        isEnabled(enabled, 'spotify') &&
        process.env.SPOTIFY_CLIENT_ID &&
        process.env.SPOTIFY_CLIENT_SECRET
      ) {
        metadata.genre = await searchSpotifyGenres(metadata.artist, metadata.title)
      }
    }
    // Step 4: LastFM (already fetched above)
    if (!metadata.genre && lastFmInfo?.genre) {
      metadata.genre = lastFmInfo.genre
    }
    // Step 5: MusicBrainz
    if (!metadata.genre && isEnabled(enabled, 'musicbrainz')) {
      metadata.genre = await fetchMusicBrainzGenres(metadata.artist, metadata.title)
    }

    updateJob(jobId, { step: 'saving' })
    const albumRepo = new AlbumRepository(db)
    const albumService = new AlbumService(albumRepo)
    const album = await albumService.create(metadata, userId)

    updateJob(jobId, { step: 'fetching_links' })
    const linkUpdates: Record<string, string> = {}

    if (isEnabled(enabled, 'lastfm')) {
      const lastFm = await fetchLastFmAlbumInfo(album.artist, album.title)
      if (lastFm?.urlLastFm) linkUpdates.urlLastFm = lastFm.urlLastFm
    }

    if (album.mbid && isEnabled(enabled, 'musicbrainz')) {
      const mb = await enrichFromMusicBrainz(album.mbid)
      if (mb.urlSpotify && isEnabled(enabled, 'spotify'))
        linkUpdates.urlSpotify = mb.urlSpotify
      if (mb.urlAppleMusic && isEnabled(enabled, 'applemusic'))
        linkUpdates.urlAppleMusic = mb.urlAppleMusic
      if (mb.urlYoutube && isEnabled(enabled, 'youtube'))
        linkUpdates.urlYoutube = mb.urlYoutube
      if (mb.urlYoutubeMusic && isEnabled(enabled, 'youtube'))
        linkUpdates.urlYoutubeMusic = mb.urlYoutubeMusic
      if (mb.urlRateYourMusic && isEnabled(enabled, 'rateyourmusic'))
        linkUpdates.urlRateYourMusic = mb.urlRateYourMusic
    }

    if (configRow?.navidromeUrl && isEnabled(enabled, 'navidrome')) {
      const navResult = await fetchNavidromeAlbumUrl(
        album.artist,
        album.title,
        {
          url: configRow.navidromeUrl,
          username: configRow.navidromeUsername!,
          password: decrypt(configRow.navidromePassword!),
        },
      )
      if (navResult) linkUpdates.urlNavidrome = navResult.relativeUrl
    }

    if (Object.keys(linkUpdates).length > 0) {
      await albumService.update(album.id, userId, linkUpdates)
    }

    updateJob(jobId, {
      status: 'complete',
      step: 'complete',
      albumId: album.id,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred'
    updateJob(jobId, { status: 'error', error: message })
  }
}

async function runPlaylistImportJob(
  jobId: string,
  playlistId: string,
  userId: string,
): Promise<void> {
  try {
    updateJob(jobId, { status: 'processing', step: 'fetching_metadata' })

    const [configRow] = await db
      .select({ enabledExternalServices: userConfig.enabledExternalServices })
      .from(userConfig)
      .where(eq(userConfig.userId, userId))
      .limit(1)
    const enabled = configRow?.enabledExternalServices ?? []

    const albums = await fetchSpotifyPlaylistAlbums(playlistId)
    if (albums.length === 0) {
      updateJob(jobId, {
        status: 'complete',
        step: 'complete',
        totalAlbums: 0,
        processedAlbums: 0,
      })
      return
    }

    updateJob(jobId, {
      totalAlbums: albums.length,
      processedAlbums: 0,
      step: 'saving',
    })

    const albumRepo = new AlbumRepository(db)
    const albumService = new AlbumService(albumRepo)
    const createdAlbumIds: string[] = []

    for (let i = 0; i < albums.length; i++) {
      const metadata = albums[i]

      if (isEnabled(enabled, 'lastfm')) {
        const lastFm = await fetchLastFmAlbumInfo(
          metadata.artist,
          metadata.title,
        )
        if (lastFm?.coverUrl) metadata.coverUrl = lastFm.coverUrl
        if (lastFm?.mbid) metadata.mbid = lastFm.mbid
      }

      const created = await albumService.create(metadata, userId)
      createdAlbumIds.push(created.id)

      updateJob(jobId, { processedAlbums: i + 1 })
    }

    updateJob(jobId, { status: 'complete', step: 'complete' })

    // Fire background enrichment for each created album — runs after job is marked complete
    for (const albumId of createdAlbumIds) {
      void enrichAlbum(albumId, userId)
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred'
    updateJob(jobId, { status: 'error', error: message })
  }
}

/**
 * Best-effort metadata enrichment for a single album.
 * Silently skips steps that fail or lack an MBID — safe to fire-and-forget.
 */
async function enrichAlbum(albumId: string, userId: string, skipArtwork = false): Promise<void> {
  try {
    const albumRepo = new AlbumRepository(db)
    const albumService = new AlbumService(albumRepo)
    const album = await albumService.findById(albumId, userId)

    const [configRow] = await db
      .select()
      .from(userConfig)
      .where(eq(userConfig.userId, userId))
      .limit(1)
    const enabled = configRow?.enabledExternalServices ?? []

    const updates: Record<string, unknown> = {}
    let mbid = album.mbid

    // Try Navidrome to resolve MBID if not already set
    if (!mbid && configRow?.navidromeUrl && isEnabled(enabled, 'navidrome')) {
      const navResult = await fetchNavidromeAlbumUrl(
        album.artist,
        album.title,
        {
          url: configRow.navidromeUrl,
          username: configRow.navidromeUsername!,
          password: decrypt(configRow.navidromePassword!),
        },
      )
      if (navResult?.mbid) {
        mbid = navResult.mbid
        updates.mbid = mbid
        updates.urlNavidrome = navResult.relativeUrl
      }
    }

    if (!mbid) return // No MBID — nothing more to do

    let lastFmCoverUrl: string | undefined
    if (isEnabled(enabled, 'lastfm')) {
      const lastFm = await fetchLastFmAlbumInfo(album.artist, album.title)
      if (lastFm?.urlLastFm) updates.urlLastFm = lastFm.urlLastFm
      lastFmCoverUrl = lastFm?.coverUrl
    }

    if (isEnabled(enabled, 'musicbrainz')) {
      if (!skipArtwork) {
        const caaCover = await fetchCoverArtFromMbid(mbid)
        // LastFM preferred over CAA
        const newCover = lastFmCoverUrl ?? caaCover
        if (newCover) updates.coverUrl = newCover
      }

      const mb = await enrichFromMusicBrainz(mbid)
      if (mb.urlSpotify && isEnabled(enabled, 'spotify'))
        updates.urlSpotify = mb.urlSpotify
      if (mb.urlAppleMusic && isEnabled(enabled, 'applemusic'))
        updates.urlAppleMusic = mb.urlAppleMusic
      if (mb.urlYoutube && isEnabled(enabled, 'youtube'))
        updates.urlYoutube = mb.urlYoutube
      if (mb.urlYoutubeMusic && isEnabled(enabled, 'youtube'))
        updates.urlYoutubeMusic = mb.urlYoutubeMusic
      if (mb.urlRateYourMusic && isEnabled(enabled, 'rateyourmusic'))
        updates.urlRateYourMusic = mb.urlRateYourMusic
    }

    if (
      !updates.urlNavidrome &&
      configRow?.navidromeUrl &&
      isEnabled(enabled, 'navidrome')
    ) {
      const navResult = await fetchNavidromeAlbumUrl(
        album.artist,
        album.title,
        {
          url: configRow.navidromeUrl,
          username: configRow.navidromeUsername!,
          password: decrypt(configRow.navidromePassword!),
        },
      )
      if (navResult) updates.urlNavidrome = navResult.relativeUrl
    }

    if (Object.keys(updates).length > 0) {
      await albumService.update(albumId, userId, updates)
    }
  } catch {
    // Background enrichment — swallow errors silently
  }
}

async function getNavidromeBaseUrl(
  db: Database,
  userId: string,
): Promise<string | null> {
  const [navRow] = await db
    .select({ navidromeUrl: userConfig.navidromeUrl })
    .from(userConfig)
    .where(eq(userConfig.userId, userId))
    .limit(1)
  return navRow?.navidromeUrl ?? null
}

function withNavidromeUrl<T extends { urlNavidrome: string | null }>(
  album: T,
  baseUrl: string,
): T {
  if (!album.urlNavidrome) return album
  return { ...album, urlNavidrome: `${baseUrl}${album.urlNavidrome}` }
}

export const albumRouter = router({
  list: protectedProcedure
    .input(albumFilterSchema)
    .query(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)

      const albums = input.artist
        ? await albumService.findByArtist(input.artist, ctx.user.id)
        : await albumService.findAll(ctx.user.id, input)

      if (albums.some((a) => a.urlNavidrome)) {
        const baseUrl = await getNavidromeBaseUrl(ctx.db, ctx.user.id)
        if (baseUrl) return albums.map((a) => withNavidromeUrl(a, baseUrl))
      }

      return albums
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      const album = await albumService.findById(input.id, ctx.user.id)

      if (album.urlNavidrome) {
        const baseUrl = await getNavidromeBaseUrl(ctx.db, ctx.user.id)
        if (baseUrl) return withNavidromeUrl(album, baseUrl)
      }

      return album
    }),

  create: protectedProcedure
    .input(createAlbumSchema)
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      return albumService.create(input, ctx.user.id)
    }),

  createFromUrl: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const { kind, id } = parseUrl(input.url)

      if (kind === 'unsupported') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'UNSUPPORTED_URL',
        })
      }

      // Check the service for this URL is enabled
      const urlService =
        kind === 'youtube'
          ? 'youtube'
          : kind === 'apple_music'
            ? 'applemusic'
            : 'spotify'
      const [configRow] = await ctx.db
        .select({ enabledExternalServices: userConfig.enabledExternalServices })
        .from(userConfig)
        .where(eq(userConfig.userId, ctx.user.id))
        .limit(1)
      const enabled = configRow?.enabledExternalServices ?? []
      if (!isEnabled(enabled, urlService)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'SERVICE_DISABLED',
        })
      }

      const jobId = createJob()
      if (kind === 'spotify_playlist') {
        void runPlaylistImportJob(jobId, id, ctx.user.id)
      } else {
        void runImportJob(jobId, input.url, ctx.user.id)
      }
      return { jobId }
    }),

  getImportStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const job = getJob(input.jobId)
      if (!job) {
        return {
          status: 'error' as const,
          step: null,
          albumId: null,
          error: 'Job not found',
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
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updateAlbumSchema }))
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      return albumService.update(input.id, ctx.user.id, input.data)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      await albumService.delete(input.id, ctx.user.id)
      return { success: true }
    }),

  refreshMetadata: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)
      const album = await albumService.findById(input.id, ctx.user.id)

      // Validate that enrichment is possible before delegating
      if (!album.mbid) {
        const [configRow] = await ctx.db
          .select({
            navidromeUrl: userConfig.navidromeUrl,
            enabledExternalServices: userConfig.enabledExternalServices,
          })
          .from(userConfig)
          .where(eq(userConfig.userId, ctx.user.id))
          .limit(1)
        const enabled = configRow?.enabledExternalServices ?? []

        if (!configRow?.navidromeUrl || !isEnabled(enabled, 'navidrome')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'NO_MBID',
          })
        }
      }

      await enrichAlbum(input.id, ctx.user.id, true)
      return albumService.findById(input.id, ctx.user.id)
    }),

  markComplete: protectedProcedure
    .input(z.object({ id: z.string().uuid(), completed: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const albumRepo = new AlbumRepository(ctx.db)
      const albumService = new AlbumService(albumRepo)

      const dateCompleted = input.completed ? new Date() : null

      return albumService.update(input.id, ctx.user.id, { dateCompleted })
    }),

  findArtwork: protectedProcedure
    .input(z.object({ artist: z.string().min(1), album: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const results: Array<{ url: string; source: string }> = []

      const [configRow] = await ctx.db
        .select()
        .from(userConfig)
        .where(eq(userConfig.userId, ctx.user.id))
        .limit(1)
      const enabled = configRow?.enabledExternalServices ?? []

      // 1. Spotify (preferred — highest quality)
      if (
        isEnabled(enabled, 'spotify') &&
        process.env.SPOTIFY_CLIENT_ID &&
        process.env.SPOTIFY_CLIENT_SECRET
      ) {
        const urls = await searchSpotifyArtwork(input.artist, input.album)
        for (const url of urls) results.push({ url, source: 'spotify' })
      }

      // 2. LastFM
      if (isEnabled(enabled, 'lastfm') && process.env.LASTFM_API_KEY) {
        const info = await fetchLastFmAlbumInfo(input.artist, input.album)
        if (info?.coverUrl) results.push({ url: info.coverUrl, source: 'lastfm' })
      }

      // 3. Navidrome (if configured)
      if (
        isEnabled(enabled, 'navidrome') &&
        configRow?.navidromeUrl &&
        configRow?.navidromePassword
      ) {
        const coverUrl = await fetchNavidromeCoverArtUrl(input.artist, input.album, {
          url: configRow.navidromeUrl,
          username: configRow.navidromeUsername!,
          password: decrypt(configRow.navidromePassword),
        })
        if (coverUrl) results.push({ url: coverUrl, source: 'navidrome' })
      }

      // 4. MusicBrainz / Cover Art Archive (fallback)
      if (isEnabled(enabled, 'musicbrainz')) {
        const urls = await searchMusicBrainzArtwork(input.artist, input.album)
        for (const url of urls) results.push({ url, source: 'musicbrainz' })
      }

      return results
    }),
})
