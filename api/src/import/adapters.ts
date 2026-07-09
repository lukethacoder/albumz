import type { AlbumMetadata } from '../services/url-import.service'
import type { NavidromeConfig } from '../services/navidrome.service'
import type { MusicBrainzUrlRels } from '../services/musicbrainz.service'
import type { Album, NewAlbum } from '../db/schema/album.schema'
import type {
  CreateAlbumInput,
  UpdateAlbumInput,
} from '../schemas/album.schema'

/**
 * Ports for the import pipeline. The pipeline orchestrates these adapters but
 * never constructs them — production wires the real fetchers, tests wire fakes.
 *
 * The three adapters mirror the three external concerns the pipeline touches:
 * metadata (the source URL), enrichment (artwork / genres / cross-service
 * links from Last.fm + MusicBrainz + Cover Art Archive), and Navidrome (a
 * user's private library).
 */

export type { AlbumMetadata, NavidromeConfig, MusicBrainzUrlRels }

/** Last.fm album lookup result — a subset of what the pipeline consumes. */
export interface LastFmAlbumInfo {
  coverUrl?: string
  mbid?: string
  urlLastFm?: string
  genre?: string
}

/** A cover-art candidate returned by an artwork search. */
export interface ArtworkResult {
  url: string
  source: string
}

/**
 * Turns a source URL into base album metadata. Wraps `url-import.service`.
 */
export interface MetadataAdapter {
  /** Classify a URL into `{ kind, id }` without any network call. */
  parseUrl(url: string): { kind: string; id: string }
  /** Fetch base metadata for a single album/track URL. */
  fetchMetadata(
    url: string,
    navidromeConfig?: NavidromeConfig,
  ): Promise<AlbumMetadata>
  /** Expand a Spotify playlist into a list of album metadata. */
  fetchPlaylistAlbums(playlistId: string): Promise<AlbumMetadata[]>
}

/**
 * Artwork, genre and cross-service link enrichment. Wraps `musicbrainz.service`
 * plus the Last.fm / Spotify / Apple lookups in `url-import.service`.
 */
export interface EnrichmentAdapter {
  fetchLastFmAlbumInfo(
    artist: string,
    album: string,
  ): Promise<LastFmAlbumInfo | undefined>
  /** Cover Art Archive lookup by release MBID. */
  fetchCoverArtFromMbid(mbid: string): Promise<string | undefined>
  /** MusicBrainz genre search by artist + album. */
  fetchMusicBrainzGenres(
    artist: string,
    album: string,
  ): Promise<string | undefined>
  /** MusicBrainz cross-service URL relations by release MBID. */
  enrichFromMusicBrainz(releaseMbid: string): Promise<MusicBrainzUrlRels>
  /** Spotify artwork candidates for the manual artwork picker. */
  searchSpotifyArtwork(artist: string, album: string): Promise<string[]>
  /** MusicBrainz / Cover Art Archive artwork candidates. */
  searchMusicBrainzArtwork(artist: string, album: string): Promise<string[]>
}

/** Navidrome album lookup result — the fields the pipeline consumes. */
export interface NavidromeAlbumResult {
  relativeUrl: string
  mbid?: string
  albumTitle?: string
  artist?: string
  releaseDate?: string
  genre?: string
}

/**
 * A user's private Navidrome library. Wraps `navidrome.service`.
 */
export interface NavidromeAdapter {
  fetchAlbumUrl(
    artist: string,
    title: string,
    config: NavidromeConfig,
  ): Promise<NavidromeAlbumResult | undefined>
  fetchCoverArtUrl(
    artist: string,
    title: string,
    config: NavidromeConfig,
  ): Promise<string | undefined>
}

/**
 * Album persistence, scoped by user. A transaction-capable subset of
 * `AlbumModule` so the pipeline can run create-then-update sequences inside a
 * single transaction without importing the `db` singleton — production wraps
 * the real `AlbumModule` + Drizzle transaction; tests wire an in-memory fake
 * with real rollback semantics.
 */
export interface AlbumStore {
  create(dto: CreateAlbumInput, userId: string): Promise<Album>
  insert(data: NewAlbum): Promise<Album>
  update(id: string, userId: string, data: UpdateAlbumInput): Promise<Album>
  findById(id: string, userId: string): Promise<Album>
  /**
   * Run `fn` against a transactional store. If `fn` throws, every write made
   * through the transactional store is rolled back and nothing persists.
   */
  transaction<T>(fn: (tx: AlbumStore) => Promise<T>): Promise<T>
}
