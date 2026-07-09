import {
  fetchMetadata,
  fetchLastFmAlbumInfo,
  fetchCoverArtFromMbid,
  fetchSpotifyPlaylistAlbums,
  searchSpotifyArtwork,
  parseUrl,
  type AlbumMetadata,
} from '../services/url-import.service'
import {
  enrichFromMusicBrainz,
  searchMusicBrainzArtwork,
  fetchMusicBrainzGenresBySearch,
} from '../services/musicbrainz.service'
import {
  fetchNavidromeAlbumUrl,
  fetchNavidromeCoverArtUrl,
  type NavidromeConfig,
} from '../services/navidrome.service'
import type {
  MetadataAdapter,
  EnrichmentAdapter,
  NavidromeAdapter,
} from './adapters'

/**
 * Production adapters — thin wrappers over the existing service modules. These
 * are the only place the pipeline is bound to the real fetchers; tests supply
 * their own fakes.
 */

export const productionMetadataAdapter: MetadataAdapter = {
  parseUrl,
  fetchMetadata: (url: string, navidromeConfig?: NavidromeConfig) =>
    fetchMetadata(url, navidromeConfig),
  fetchPlaylistAlbums: (playlistId: string): Promise<AlbumMetadata[]> =>
    fetchSpotifyPlaylistAlbums(playlistId),
}

export const productionEnrichmentAdapter: EnrichmentAdapter = {
  fetchLastFmAlbumInfo,
  fetchCoverArtFromMbid,
  fetchMusicBrainzGenres: fetchMusicBrainzGenresBySearch,
  enrichFromMusicBrainz,
  searchSpotifyArtwork,
  searchMusicBrainzArtwork,
}

export const productionNavidromeAdapter: NavidromeAdapter = {
  fetchAlbumUrl: fetchNavidromeAlbumUrl,
  fetchCoverArtUrl: fetchNavidromeCoverArtUrl,
}
