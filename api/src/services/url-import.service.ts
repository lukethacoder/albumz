import type { CreateAlbumInput } from '../schemas/album.schema'
import type { NavidromeConfig } from './navidrome.service'
import { fetchNavidromeAlbumUrl } from './navidrome.service'

export type AlbumMetadata = Pick<
  CreateAlbumInput,
  'title' | 'artist' | 'releaseDate' | 'coverUrl' | 'mbid' | 'genre'
>

/**
 * Normalize external date strings to YYYY-MM-DD.
 * Spotify (and others) return year-only ("2005") or year-month ("2005-01").
 * PostgreSQL requires a full date.
 */
function normalizeDate(date: string | undefined): string | undefined {
  if (!date) return undefined
  const parts = date.split('-')
  if (parts.length === 1) return `${parts[0]}-01-01`
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-01`
  return date
}

type UrlKind =
  | 'spotify_album'
  | 'spotify_track'
  | 'spotify_playlist'
  | 'apple_music'
  | 'youtube'
  | 'unsupported'

export function parseUrl(url: string): { kind: UrlKind; id: string } {
  const spotifyAlbum = url.match(/open\.spotify\.com\/album\/([A-Za-z0-9]+)/)
  if (spotifyAlbum) return { kind: 'spotify_album', id: spotifyAlbum[1] }

  const spotifyTrack = url.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/)
  if (spotifyTrack) return { kind: 'spotify_track', id: spotifyTrack[1] }

  const spotifyPlaylist = url.match(
    /open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/,
  )
  if (spotifyPlaylist)
    return { kind: 'spotify_playlist', id: spotifyPlaylist[1] }

  // music.apple.com/{country}/album/{slug}/{id} or {id}?i={track-id}
  const appleMusic = url.match(/music\.apple\.com\/[^/]+\/album\/[^/]*\/(\d+)/)
  if (appleMusic) return { kind: 'apple_music', id: appleMusic[1] }

  const youtube = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]+)/,
  )
  if (youtube) return { kind: 'youtube', id: youtube[1] }

  return { kind: 'unsupported', id: '' }
}

// Spotify token cache — module-level singleton
let spotifyTokenCache: { token: string; expiresAt: number } | null = null

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.',
    )
  }

  if (spotifyTokenCache && Date.now() < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error('Failed to authenticate with Spotify')

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
  }
  spotifyTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return spotifyTokenCache.token
}

async function fetchSpotifyAlbum(albumId: string): Promise<AlbumMetadata> {
  const token = await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Album not found on Spotify')

  const data = (await res.json()) as {
    name: string
    artists: { name: string }[]
    release_date: string
    images: { url: string }[]
    genres: string[]
  }

  return {
    title: data.name,
    artist: data.artists.map((a) => a.name).join(', '),
    releaseDate: normalizeDate(data.release_date || undefined),
    coverUrl: data.images[0]?.url,
    genre: data.genres?.length ? data.genres.join(';') : undefined,
  }
}

async function fetchSpotifyTrack(trackId: string): Promise<AlbumMetadata> {
  const token = await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Track not found on Spotify')

  const data = (await res.json()) as {
    album: {
      id: string
      name: string
      artists: { name: string }[]
      release_date: string
      images: { url: string }[]
    }
  }

  // Fetch the full album to get genres (track response has a simplified album object)
  let genre: string | undefined
  try {
    const albumRes = await fetch(`https://api.spotify.com/v1/albums/${data.album.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (albumRes.ok) {
      const albumData = (await albumRes.json()) as { genres: string[] }
      if (albumData.genres?.length) genre = albumData.genres.join(';')
    }
  } catch {
    // genre stays undefined
  }

  return {
    title: data.album.name,
    artist: data.album.artists.map((a) => a.name).join(', '),
    releaseDate: normalizeDate(data.album.release_date || undefined),
    coverUrl: data.album.images[0]?.url,
    genre,
  }
}

async function fetchLastFmTrackInfo(
  artist: string,
  track: string,
): Promise<
  | { albumTitle: string; coverUrl?: string; mbid?: string; urlLastFm?: string }
  | undefined
> {
  const apiKey = process.env.LASTFM_API_KEY
  if (!apiKey) return undefined

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=${encodeURIComponent(apiKey)}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`
    const res = await fetch(url)
    if (!res.ok) return undefined

    const data = (await res.json()) as {
      track?: {
        album?: {
          mbid?: string
          title: string
          url?: string
          image?: Array<{ '#text': string; size: string }>
        }
      }
    }

    const album = data.track?.album
    if (!album?.title) return undefined

    const images = album.image ?? []
    let coverUrl: string | undefined
    for (const size of ['extralarge', 'large', 'medium', 'small']) {
      const img = images.find((i) => i.size === size && i['#text'])
      if (img?.['#text']) {
        coverUrl = img['#text']
        break
      }
    }

    return {
      albumTitle: album.title,
      coverUrl,
      mbid: album.mbid || undefined,
      urlLastFm: album.url || undefined,
    }
  } catch {
    return undefined
  }
}

async function fetchAppleMusicAlbum(albumId: string): Promise<AlbumMetadata> {
  const res = await fetch(
    `https://itunes.apple.com/lookup?id=${albumId}&entity=album`,
  )
  if (!res.ok) throw new Error('Album not found on Apple Music')

  const data = (await res.json()) as {
    results?: Array<{
      wrapperType: string
      collectionName: string
      artistName: string
      releaseDate?: string
      artworkUrl100?: string
      primaryGenreName?: string
    }>
  }

  const album = data.results?.find((r) => r.wrapperType === 'collection')
  if (!album) throw new Error('Album not found on Apple Music')

  // artworkUrl100 can be upscaled by replacing the size segment
  const coverUrl = album.artworkUrl100?.replace('100x100bb', '600x600bb')

  return {
    title: album.collectionName,
    artist: album.artistName,
    releaseDate: album.releaseDate
      ? album.releaseDate.split('T')[0]
      : undefined,
    coverUrl,
    genre: album.primaryGenreName || undefined,
  }
}

// Bracketed/parenthesized tags commonly added by YouTube uploaders that aren't part of the title
const YOUTUBE_NOISE_RE =
  /\s*[\[(]\s*(?:official(?:\s+(?:music\s+)?(?:video|audio|lyric\s+video|visualizer))?|lyric\s+video|lyrics|audio|visualizer|music\s+video|video|hd|hq|4k|1080p|720p|full\s+(?:album|video))\s*[\])]/gi

function cleanYouTubeTitle(title: string): string {
  return title.replace(YOUTUBE_NOISE_RE, '').trim()
}

async function fetchYouTubeMetadata(
  url: string,
  navidromeConfig?: NavidromeConfig,
): Promise<AlbumMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  const res = await fetch(oembedUrl)
  if (!res.ok) throw new Error('Video not found on YouTube')

  const data = (await res.json()) as {
    title: string
    author_name: string
    thumbnail_url?: string
  }
  const title = data.title ?? ''
  const channelName = data.author_name ?? 'Unknown Artist'
  const thumbnailUrl = data.thumbnail_url

  // Try to parse "Artist - Track" or "Artist – Track"
  const dashMatch = title.match(/^(.+?)\s+[-–]\s+(.+)$/)
  if (dashMatch) {
    const artist = dashMatch[1].trim()
    const trackName = cleanYouTubeTitle(dashMatch[2].trim())

    // Try Navidrome first — it can resolve the album name and release date from a track name
    if (navidromeConfig) {
      const navResult = await fetchNavidromeAlbumUrl(
        artist,
        trackName,
        navidromeConfig,
      )
      if (navResult?.albumTitle) {
        return {
          title: navResult.albumTitle,
          artist: navResult.artist ?? artist,
          releaseDate: navResult.releaseDate,
          coverUrl: thumbnailUrl,
          mbid: navResult.mbid,
        }
      }
    }

    // Fall back to Last.fm
    const trackInfo = await fetchLastFmTrackInfo(artist, trackName)
    if (trackInfo) {
      return {
        title: trackInfo.albumTitle,
        artist,
        coverUrl: trackInfo.coverUrl ?? thumbnailUrl,
        mbid: trackInfo.mbid,
      }
    }

    // Last resort — use the parsed track name as the title
    return { title: trackName, artist, coverUrl: thumbnailUrl }
  }

  return {
    title: cleanYouTubeTitle(title),
    artist: channelName,
    coverUrl: thumbnailUrl,
  }
}

export async function fetchSpotifyPlaylistAlbums(
  playlistId: string,
): Promise<AlbumMetadata[]> {
  const token = await getSpotifyToken()
  const seen = new Set<string>()
  const albums: AlbumMetadata[] = []

  type TrackPage = {
    items: Array<{
      track: {
        album: {
          id: string
          name: string
          artists: { name: string }[]
          release_date: string
          images: { url: string }[]
        }
      } | null
    }>
    next: string | null
  }

  let nextUrl: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks` +
    `?limit=100&fields=next,items(track(album(id,name,artists,release_date,images)))`

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Playlist not found on Spotify')

    const page = (await res.json()) as TrackPage

    for (const item of page.items) {
      const album = item.track?.album
      if (!album || seen.has(album.id)) continue
      seen.add(album.id)
      albums.push({
        title: album.name,
        artist: album.artists.map((a) => a.name).join(', '),
        releaseDate: normalizeDate(album.release_date || undefined),
        coverUrl: album.images[0]?.url,
      })
    }

    nextUrl = page.next
  }

  return albums
}

export async function fetchMetadata(
  url: string,
  navidromeConfig?: NavidromeConfig,
): Promise<AlbumMetadata> {
  const { kind, id } = parseUrl(url)

  switch (kind) {
    case 'spotify_album':
      return fetchSpotifyAlbum(id)
    case 'spotify_track':
      return fetchSpotifyTrack(id)
    case 'apple_music':
      return fetchAppleMusicAlbum(id)
    case 'youtube':
      return fetchYouTubeMetadata(url, navidromeConfig)
    default:
      throw new Error(
        'Unsupported URL. Please provide a Spotify album/track or YouTube URL.',
      )
  }
}

export async function fetchCoverArtFromMbid(
  mbid: string,
): Promise<string | undefined> {
  try {
    const res = await fetch(`https://coverartarchive.org/release/${mbid}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return undefined

    const data = (await res.json()) as {
      images?: Array<{
        front: boolean
        approved: boolean
        image: string
        thumbnails: { '1200'?: string; large?: string; '500'?: string }
      }>
    }

    const front =
      data.images?.find((img) => img.front && img.approved) ??
      data.images?.find((img) => img.front) ??
      data.images?.[0]

    if (!front) return undefined
    return (
      front.thumbnails['1200'] ??
      front.thumbnails.large ??
      front.thumbnails['500'] ??
      front.image
    )
  } catch {
    return undefined
  }
}

export async function searchSpotifyArtwork(
  artist: string,
  album: string,
): Promise<string[]> {
  try {
    const token = await getSpotifyToken()
    const q = `album:${album} artist:${artist}`
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) return []
    const data = (await res.json()) as {
      albums?: { items?: Array<{ images?: Array<{ url: string }> }> }
    }
    return (data.albums?.items ?? [])
      .map((item) => item.images?.[0]?.url)
      .filter((url): url is string => !!url)
  } catch {
    return []
  }
}

export async function fetchLastFmAlbumInfo(
  artist: string,
  album: string,
): Promise<
  { coverUrl?: string; mbid?: string; urlLastFm?: string; genre?: string } | undefined
> {
  const apiKey = process.env.LASTFM_API_KEY
  if (!apiKey) return undefined

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${encodeURIComponent(apiKey)}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&format=json`
    const res = await fetch(url)
    if (!res.ok) return undefined

    const data = (await res.json()) as {
      album?: {
        mbid?: string
        url?: string
        image?: Array<{ '#text': string; size: string }>
        tags?: { tag?: Array<{ name: string }> }
      }
    }

    const images = data.album?.image ?? []
    let coverUrl: string | undefined
    for (const size of ['extralarge', 'large', 'medium', 'small']) {
      const img = images.find((i) => i.size === size && i['#text'])
      if (img?.['#text']) {
        coverUrl = img['#text']
        break
      }
    }

    const tags = data.album?.tags?.tag ?? []
    const genre = tags.length
      ? tags.slice(0, 5).map((t) => t.name).join(';')
      : undefined

    return {
      coverUrl,
      mbid: data.album?.mbid || undefined,
      urlLastFm: data.album?.url || undefined,
      genre,
    }
  } catch {
    return undefined
  }
}

export async function searchSpotifyGenres(
  artist: string,
  album: string,
): Promise<string | undefined> {
  try {
    const token = await getSpotifyToken()
    const q = `album:${album} artist:${artist}`
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!searchRes.ok) return undefined
    const searchData = (await searchRes.json()) as {
      albums?: { items?: Array<{ id: string }> }
    }
    const albumId = searchData.albums?.items?.[0]?.id
    if (!albumId) return undefined

    const albumRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!albumRes.ok) return undefined
    const albumData = (await albumRes.json()) as { genres: string[] }
    return albumData.genres?.length ? albumData.genres.join(';') : undefined
  } catch {
    return undefined
  }
}

export async function searchAppleMusicGenre(
  artist: string,
  album: string,
): Promise<string | undefined> {
  try {
    const q = `${artist} ${album}`
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=1`,
    )
    if (!res.ok) return undefined
    const data = (await res.json()) as {
      results?: Array<{ wrapperType: string; primaryGenreName?: string }>
    }
    const result = data.results?.find((r) => r.wrapperType === 'collection')
    return result?.primaryGenreName || undefined
  } catch {
    return undefined
  }
}
