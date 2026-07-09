import type { Album, NewAlbum } from '../db/schema/album.schema'
import type {
  CreateAlbumInput,
  UpdateAlbumInput,
} from '../schemas/album.schema'
import type {
  AlbumStore,
  MetadataAdapter,
  EnrichmentAdapter,
  NavidromeAdapter,
  LastFmAlbumInfo,
  NavidromeAlbumResult,
  MusicBrainzUrlRels,
} from './adapters'
import type { ImportJob, JobStatus } from '../services/job-store'
import type { JobStore } from './import-pipeline'
import type { UserImportConfig } from './user-config'

/**
 * Test doubles for the import pipeline. The pipeline accepts every external
 * dependency as an injected port, so these fakes let the domain rules be
 * exercised with no network or database.
 */

const USER_ID = '11111111-1111-1111-1111-111111111111'

export { USER_ID }

/** In-memory job store — real progress semantics, observable for assertions. */
export class FakeJobStore implements JobStore {
  private readonly jobs = new Map<string, ImportJob>()
  private counter = 0
  /** Ordered log of steps/statuses seen, for transition assertions. */
  readonly history: string[] = []

  createJob(): string {
    const id = `job-${++this.counter}`
    this.jobs.set(id, {
      status: 'pending',
      step: null,
      albumId: null,
      error: null,
      createdAt: new Date(),
      totalAlbums: null,
      processedAlbums: null,
    })
    return id
  }

  updateJob(id: string, update: Partial<Omit<ImportJob, 'createdAt'>>): void {
    const job = this.jobs.get(id)
    if (!job) return
    Object.assign(job, update)
    if (update.status) this.history.push(`status:${update.status}`)
    if (update.step !== undefined && update.step !== null)
      this.history.push(`step:${update.step}`)
  }

  getJob(id: string): ImportJob | undefined {
    return this.jobs.get(id)
  }
}

/**
 * In-memory album store with real transaction rollback semantics: a
 * transactional child buffers its writes and only merges them into the parent
 * store on success. If the transaction callback throws, buffered writes are
 * discarded.
 */
export class FakeAlbumStore implements AlbumStore {
  private idCounter = 0
  readonly rows: Map<string, Album>

  constructor(rows?: Map<string, Album>) {
    this.rows = rows ?? new Map<string, Album>()
  }

  private makeAlbum(partial: Partial<Album> & { userId: string }): Album {
    const now = new Date()
    return {
      id: partial.id ?? `album-${++this.idCounter}`,
      userId: partial.userId,
      title: partial.title ?? '',
      artist: partial.artist ?? '',
      genre: partial.genre ?? null,
      releaseDate: partial.releaseDate ?? null,
      description: partial.description ?? null,
      coverUrl: partial.coverUrl ?? null,
      dateCompleted: partial.dateCompleted ?? null,
      createdAt: partial.createdAt ?? now,
      updatedAt: partial.updatedAt ?? now,
      mbid: partial.mbid ?? null,
      urlLastFm: partial.urlLastFm ?? null,
      urlSpotify: partial.urlSpotify ?? null,
      urlAppleMusic: partial.urlAppleMusic ?? null,
      urlYoutube: partial.urlYoutube ?? null,
      urlYoutubeMusic: partial.urlYoutubeMusic ?? null,
      urlRateYourMusic: partial.urlRateYourMusic ?? null,
      urlNavidrome: partial.urlNavidrome ?? null,
      rating: partial.rating ?? null,
    }
  }

  create(dto: CreateAlbumInput, userId: string): Promise<Album> {
    const album = this.makeAlbum({
      userId,
      title: dto.title,
      artist: dto.artist,
      genre: dto.genre ?? null,
      releaseDate: dto.releaseDate ?? null,
      description: dto.description ?? null,
      coverUrl: dto.coverUrl ?? null,
      mbid: dto.mbid ?? null,
    })
    this.rows.set(album.id, album)
    return Promise.resolve(album)
  }

  insert(data: NewAlbum): Promise<Album> {
    const album = this.makeAlbum({ ...data } as Partial<Album> & {
      userId: string
    })
    this.rows.set(album.id, album)
    return Promise.resolve(album)
  }

  update(id: string, userId: string, data: UpdateAlbumInput): Promise<Album> {
    const existing = this.rows.get(id)
    if (!existing || existing.userId !== userId) {
      return Promise.reject(new Error(`Album ${id} not found`))
    }
    const { dateCompleted, ...rest } = data
    const updated: Album = {
      ...existing,
      ...(rest as Partial<Album>),
      dateCompleted:
        dateCompleted != null
          ? new Date(dateCompleted)
          : existing.dateCompleted,
      updatedAt: new Date(),
    }
    this.rows.set(id, updated)
    return Promise.resolve(updated)
  }

  findById(id: string, userId: string): Promise<Album> {
    const album = this.rows.get(id)
    if (!album || album.userId !== userId) {
      return Promise.reject(new Error(`Album ${id} not found`))
    }
    return Promise.resolve(album)
  }

  async transaction<T>(fn: (tx: AlbumStore) => Promise<T>): Promise<T> {
    // Buffer writes in a snapshot; only commit to the parent on success.
    const snapshot = new Map(this.rows)
    const child = new FakeAlbumStore(snapshot)
    child.idCounter = this.idCounter
    // If `fn` rejects, the commit below never runs, so the parent's rows are
    // left untouched — a rollback.
    const result = await fn(child)
    this.rows.clear()
    for (const [k, v] of child.rows) this.rows.set(k, v)
    this.idCounter = child.idCounter
    return result
  }
}

/** Builder for a configurable fake metadata adapter. */
export function fakeMetadataAdapter(
  overrides: Partial<MetadataAdapter> = {},
): MetadataAdapter {
  return {
    parseUrl: (url: string) => {
      if (url.includes('spotify.com/album'))
        return { kind: 'spotify_album', id: 'sp1' }
      if (url.includes('spotify.com/track'))
        return { kind: 'spotify_track', id: 'sp2' }
      if (url.includes('spotify.com/playlist'))
        return { kind: 'spotify_playlist', id: 'pl1' }
      if (url.includes('music.apple.com'))
        return { kind: 'apple_music', id: 'am1' }
      if (url.includes('youtube.com')) return { kind: 'youtube', id: 'yt1' }
      return { kind: 'unsupported', id: '' }
    },
    fetchMetadata: () =>
      Promise.resolve({ title: 'Untitled', artist: 'Unknown' }),
    fetchPlaylistAlbums: () => Promise.resolve([]),
    ...overrides,
  }
}

export function fakeEnrichmentAdapter(
  overrides: Partial<EnrichmentAdapter> = {},
): EnrichmentAdapter {
  return {
    fetchLastFmAlbumInfo: (): Promise<LastFmAlbumInfo | undefined> =>
      Promise.resolve(undefined),
    fetchCoverArtFromMbid: () => Promise.resolve(undefined),
    fetchMusicBrainzGenres: () => Promise.resolve(undefined),
    enrichFromMusicBrainz: (): Promise<MusicBrainzUrlRels> =>
      Promise.resolve({}),
    searchSpotifyArtwork: () => Promise.resolve([]),
    searchMusicBrainzArtwork: () => Promise.resolve([]),
    ...overrides,
  }
}

export function fakeNavidromeAdapter(
  overrides: Partial<NavidromeAdapter> = {},
): NavidromeAdapter {
  return {
    fetchAlbumUrl: (): Promise<NavidromeAlbumResult | undefined> =>
      Promise.resolve(undefined),
    fetchCoverArtUrl: () => Promise.resolve(undefined),
    ...overrides,
  }
}

export function fakeLoadConfig(
  config: Partial<UserImportConfig> = {},
): () => Promise<UserImportConfig> {
  const resolved: UserImportConfig = {
    enabledServices: config.enabledServices ?? [],
    navidrome: config.navidrome,
    navidromeUrl: config.navidromeUrl,
  }
  return () => Promise.resolve(resolved)
}

export type { JobStatus }
