import { ImportPipeline } from './import-pipeline'
import type { Database } from '../db/database'
import {
  USER_ID,
  FakeJobStore,
  FakeAlbumStore,
  fakeMetadataAdapter,
  fakeEnrichmentAdapter,
  fakeNavidromeAdapter,
  fakeLoadConfig,
} from './test-fakes'
import type {
  MetadataAdapter,
  EnrichmentAdapter,
  NavidromeAdapter,
} from './adapters'
import type { UserImportConfig } from './user-config'

/**
 * Import pipeline tests. Every external dependency is a fake, so the app's real
 * behaviour — cover-art priority, Spotify genre suppression, numeric-genre
 * cleanup, transactional persistence, graceful degradation, and job status
 * transitions — is exercised without any network or database.
 */

// The pipeline never touches `db` directly (config loading is faked), so a
// placeholder handle is sufficient.
const FAKE_DB = {} as Database

interface BuildOpts {
  metadata?: Partial<MetadataAdapter>
  enrichment?: Partial<EnrichmentAdapter>
  navidrome?: Partial<NavidromeAdapter>
  config?: Partial<UserImportConfig>
  albums?: FakeAlbumStore
  jobs?: FakeJobStore
}

function build(opts: BuildOpts = {}) {
  const jobs = opts.jobs ?? new FakeJobStore()
  const albums = opts.albums ?? new FakeAlbumStore()
  const pipeline = new ImportPipeline({
    db: FAKE_DB,
    albums,
    metadata: fakeMetadataAdapter(opts.metadata),
    enrichment: fakeEnrichmentAdapter(opts.enrichment),
    navidrome: fakeNavidromeAdapter(opts.navidrome),
    jobs,
    loadConfig: fakeLoadConfig(opts.config),
  })
  return { pipeline, jobs, albums }
}

/** Await a fire-and-forget import job until it is no longer running. */
async function runToCompletion(
  pipeline: ImportPipeline,
  jobId: string,
): Promise<void> {
  for (let i = 0; i < 100; i++) {
    const status = pipeline.status(jobId).status
    if (status === 'complete' || status === 'error') return
    await new Promise((r) => setImmediate(r))
  }
  throw new Error('Job did not finish')
}

const SPOTIFY_ALBUM_URL = 'https://open.spotify.com/album/abc'
const YOUTUBE_URL = 'https://youtube.com/watch?v=abc'

describe('ImportPipeline', () => {
  describe('artwork priority', () => {
    it('prefers the Spotify image over LastFM and CAA for a Spotify source', async () => {
      const { pipeline, albums } = build({
        config: { enabledServices: ['spotify', 'lastfm', 'musicbrainz'] },
        metadata: {
          fetchMetadata: async () => ({
            title: 'A',
            artist: 'B',
            coverUrl: 'spotify.jpg',
            mbid: '00000000-0000-0000-0000-000000000001',
          }),
        },
        enrichment: {
          fetchLastFmAlbumInfo: async () => ({ coverUrl: 'lastfm.jpg' }),
          fetchCoverArtFromMbid: async () => 'caa.jpg',
        },
      })

      const { jobId } = pipeline.importFromUrl(SPOTIFY_ALBUM_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      const album = [...albums.rows.values()][0]
      expect(album.coverUrl).toBe('spotify.jpg')
    })

    it('prefers LastFM over the source thumbnail for a non-Spotify source', async () => {
      const { pipeline, albums } = build({
        config: { enabledServices: ['youtube', 'lastfm', 'musicbrainz'] },
        metadata: {
          fetchMetadata: async () => ({
            title: 'A',
            artist: 'B',
            coverUrl: 'youtube-thumb.jpg',
          }),
        },
        enrichment: {
          fetchLastFmAlbumInfo: async () => ({
            coverUrl: 'lastfm.jpg',
            mbid: '00000000-0000-0000-0000-000000000002',
          }),
          fetchCoverArtFromMbid: async () => 'caa.jpg',
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      const album = [...albums.rows.values()][0]
      expect(album.coverUrl).toBe('lastfm.jpg')
    })
  })

  describe('Spotify genre suppression', () => {
    it('discards genre metadata from a Spotify source', async () => {
      const { pipeline, albums } = build({
        // Only spotify enabled — no other genre source can contribute.
        config: { enabledServices: ['spotify'] },
        metadata: {
          fetchMetadata: async () => ({
            title: 'A',
            artist: 'B',
            genre: 'Pop;Dance',
          }),
        },
      })

      const { jobId } = pipeline.importFromUrl(SPOTIFY_ALBUM_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      const album = [...albums.rows.values()][0]
      expect(album.genre).toBeNull()
    })

    it('keeps genre metadata from a non-Spotify source', async () => {
      const { pipeline, albums } = build({
        config: { enabledServices: ['youtube'] },
        metadata: {
          fetchMetadata: async () => ({
            title: 'A',
            artist: 'B',
            genre: 'Rock',
          }),
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      const album = [...albums.rows.values()][0]
      expect(album.genre).toBe('Rock')
    })
  })

  describe('numeric-genre cleanup and title-casing', () => {
    it('drops decade "genres" and title-cases real ones from enrichment', async () => {
      const { pipeline, albums } = build({
        config: { enabledServices: ['youtube', 'musicbrainz'] },
        metadata: {
          fetchMetadata: async () => ({ title: 'A', artist: 'B' }),
        },
        enrichment: {
          fetchMusicBrainzGenres: async () => 'rock;1990;hip hop;80s',
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      const album = [...albums.rows.values()][0]
      expect(album.genre).toBe('Rock;Hip Hop')
    })
  })

  describe('graceful degradation', () => {
    it('leaves an album intact when background enrichment fetchers throw', async () => {
      const albums = new FakeAlbumStore()
      const existing = await albums.insert({
        userId: USER_ID,
        title: 'A',
        artist: 'B',
        mbid: '00000000-0000-0000-0000-000000000009',
        coverUrl: 'original.jpg',
      })

      const { pipeline } = build({
        albums,
        config: { enabledServices: ['lastfm', 'musicbrainz'] },
        enrichment: {
          fetchLastFmAlbumInfo: async () => {
            throw new Error('LastFM down')
          },
          enrichFromMusicBrainz: async () => {
            throw new Error('MB down')
          },
        },
      })

      // Must not throw — background enrichment swallows adapter failures.
      await expect(
        pipeline.enrichAlbum(existing.id, USER_ID),
      ).resolves.toBeUndefined()

      const album = await albums.findById(existing.id, USER_ID)
      expect(album.coverUrl).toBe('original.jpg')
    })

    it('completes with partial metadata when an optional link lookup returns nothing', async () => {
      const { pipeline, albums } = build({
        config: { enabledServices: ['youtube', 'lastfm', 'musicbrainz'] },
        metadata: {
          fetchMetadata: async () => ({
            title: 'A',
            artist: 'B',
            coverUrl: 'youtube-thumb.jpg',
          }),
        },
        enrichment: {
          // No links / genres available from any source.
          fetchLastFmAlbumInfo: async () => undefined,
          fetchMusicBrainzGenres: async () => undefined,
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      expect(pipeline.status(jobId).status).toBe('complete')
      const album = [...albums.rows.values()][0]
      expect(album.title).toBe('A')
      expect(album.coverUrl).toBe('youtube-thumb.jpg')
      expect(album.genre).toBeNull()
      expect(album.urlLastFm).toBeNull()
    })
  })

  describe('transactional persistence', () => {
    it('persists nothing when a mid-sequence enrichment (link) fetch throws', async () => {
      const albums = new FakeAlbumStore()
      const { pipeline } = build({
        albums,
        config: { enabledServices: ['youtube', 'lastfm', 'musicbrainz'] },
        metadata: {
          fetchMetadata: async () => ({
            title: 'A',
            artist: 'B',
            mbid: '00000000-0000-0000-0000-000000000003',
            coverUrl: 'youtube-thumb.jpg',
          }),
        },
        enrichment: {
          // Runs after the album has been created inside the transaction.
          enrichFromMusicBrainz: async () => {
            throw new Error('MB relations down')
          },
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      expect(pipeline.status(jobId).status).toBe('error')
      // The create happened inside the transaction, then the link fetch threw —
      // the transaction rolled back, so no album survives.
      expect(albums.rows.size).toBe(0)
    })

    it('commits both the create and the link update on success', async () => {
      const albums = new FakeAlbumStore()
      const { pipeline } = build({
        albums,
        config: {
          enabledServices: ['youtube', 'lastfm', 'musicbrainz', 'spotify'],
        },
        metadata: {
          fetchMetadata: async () => ({
            title: 'A',
            artist: 'B',
            mbid: '00000000-0000-0000-0000-000000000004',
          }),
        },
        enrichment: {
          fetchLastFmAlbumInfo: async () => ({
            urlLastFm: 'https://last.fm/a',
          }),
          enrichFromMusicBrainz: async () => ({
            urlSpotify: 'https://spotify/a',
          }),
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      expect(pipeline.status(jobId).status).toBe('complete')
      const album = [...albums.rows.values()][0]
      expect(album.urlLastFm).toBe('https://last.fm/a')
      expect(album.urlSpotify).toBe('https://spotify/a')
    })
  })

  describe('job status transitions', () => {
    it('moves processing -> steps -> complete, observable through status()', async () => {
      const { pipeline, jobs } = build({
        config: { enabledServices: ['youtube'] },
        metadata: {
          fetchMetadata: async () => ({ title: 'A', artist: 'B' }),
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      const final = pipeline.status(jobId)
      expect(final.status).toBe('complete')
      expect(final.step).toBe('complete')
      expect(final.albumId).not.toBeNull()

      expect(jobs.history).toEqual([
        'status:processing',
        'step:parsing',
        'step:fetching_metadata',
        'step:fetching_artwork',
        'step:saving',
        'step:fetching_links',
        'status:complete',
        'step:complete',
      ])
    })

    it('reports a not-found job as an error status', () => {
      const { pipeline } = build()
      const status = pipeline.status('does-not-exist')
      expect(status.status).toBe('error')
      expect(status.error).toBe('Job not found')
    })

    it('transitions to error when metadata fetching throws', async () => {
      const { pipeline } = build({
        config: { enabledServices: ['youtube'] },
        metadata: {
          fetchMetadata: async () => {
            throw new Error('boom')
          },
        },
      })

      const { jobId } = pipeline.importFromUrl(YOUTUBE_URL, USER_ID)
      await runToCompletion(pipeline, jobId)

      const status = pipeline.status(jobId)
      expect(status.status).toBe('error')
      expect(status.error).toBe('boom')
    })
  })

  describe('playlist import', () => {
    it('imports every album and reports progress', async () => {
      const { pipeline, albums, jobs } = build({
        config: { enabledServices: ['spotify'] },
        metadata: {
          fetchPlaylistAlbums: async () => [
            { title: 'One', artist: 'A' },
            { title: 'Two', artist: 'B' },
          ],
        },
      })

      const { jobId } = pipeline.importPlaylist('pl1', USER_ID)
      await runToCompletion(pipeline, jobId)

      const status = pipeline.status(jobId)
      expect(status.status).toBe('complete')
      expect(status.totalAlbums).toBe(2)
      expect(status.processedAlbums).toBe(2)
      expect(albums.rows.size).toBe(2)
      expect(jobs.history).toContain('status:complete')
    })

    it('completes with zero albums for an empty playlist', async () => {
      const { pipeline, albums } = build({
        metadata: { fetchPlaylistAlbums: async () => [] },
      })

      const { jobId } = pipeline.importPlaylist('pl1', USER_ID)
      await runToCompletion(pipeline, jobId)

      const status = pipeline.status(jobId)
      expect(status.status).toBe('complete')
      expect(status.totalAlbums).toBe(0)
      expect(albums.rows.size).toBe(0)
    })
  })
})
