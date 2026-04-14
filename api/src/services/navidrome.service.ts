import { createHash, randomBytes } from 'crypto'

export interface NavidromeConfig {
  url: string
  username: string
  password: string // decrypted
}

export type NavidromeAlbumResult = {
  relativeUrl: string
  mbid?: string
  albumTitle?: string
  artist?: string
  releaseDate?: string // YYYY-MM-DD, YYYY-MM, or YYYY depending on available precision
  genre?: string
}

type SubsonicSong = {
  albumId: string
  album: string
  artist: string
}

type SubsonicSearchResponse = {
  'subsonic-response': {
    status: string
    searchResult3?: {
      song?: SubsonicSong[]
    }
  }
}

type ItemDate = {
  year?: number
  month?: number
  day?: number
}

type SubsonicGetAlbumResponse = {
  'subsonic-response': {
    status: string
    album?: {
      id: string
      name: string
      artist?: string
      musicBrainzId?: string
      originalReleaseDate?: ItemDate
      genre?: string
    }
  }
}

function buildSubsonicParams(
  config: NavidromeConfig,
  extra: Record<string, string>,
): URLSearchParams {
  const salt = randomBytes(6).toString('hex')
  const token = createHash('md5')
    .update(config.password + salt)
    .digest('hex')
  return new URLSearchParams({
    c: 'albumz',
    f: 'json',
    v: '1.13.0',
    u: config.username,
    s: salt,
    t: token,
    ...extra,
  })
}

function formatItemDate(d: ItemDate): string | undefined {
  if (!d.year) return undefined
  const y = String(d.year)
  const m = String(d.month ?? 1).padStart(2, '0')
  const dd = String(d.day ?? 1).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/**
 * Returns a direct cover art URL for a Navidrome album, authenticated via Subsonic token auth.
 * The returned URL embeds authentication parameters and is valid as long as credentials don't change.
 */
export async function fetchNavidromeCoverArtUrl(
  artist: string,
  title: string,
  config: NavidromeConfig,
): Promise<string | undefined> {
  const result = await fetchNavidromeAlbumUrl(artist, title, config)
  if (!result) return undefined

  // Extract albumId from relativeUrl: /app/#/album/{id}/show
  const albumIdMatch = result.relativeUrl.match(/\/album\/([^/]+)\/show/)
  if (!albumIdMatch?.[1]) return undefined

  const params = buildSubsonicParams(config, { id: albumIdMatch[1], size: '600' })
  return `${config.url}/rest/getCoverArt.view?${params}`
}

/**
 * Find a Navidrome album by searching for artist and title (or track name) via the Subsonic API.
 * Returns the relative album URL, MusicBrainz ID, album title, artist, and release date if available.
 */
export async function fetchNavidromeAlbumUrl(
  artist: string,
  title: string,
  config: NavidromeConfig,
): Promise<NavidromeAlbumResult | undefined> {
  try {
    const searchParams = buildSubsonicParams(config, {
      query: `${artist} - ${title}`,
      songCount: '5',
      songOffset: '0',
      albumCount: '0',
      albumOffset: '0',
      artistCount: '0',
      artistOffset: '0',
    })

    const searchRes = await fetch(
      `${config.url}/rest/search3.view?${searchParams}`,
    )
    if (!searchRes.ok) return undefined

    const searchData = (await searchRes.json()) as SubsonicSearchResponse
    const songs = searchData['subsonic-response']?.searchResult3?.song
    if (!songs?.length) return undefined

    const song = songs[0]
    const albumId = song.albumId
    if (!albumId) return undefined

    // Fetch album details to get the MusicBrainz ID, original release date, and canonical metadata
    const albumParams = buildSubsonicParams(config, { id: albumId })
    const albumRes = await fetch(
      `${config.url}/rest/getAlbum.view?${albumParams}`,
    )

    let mbid: string | undefined
    let albumTitle: string | undefined = song.album || undefined
    let albumArtist: string | undefined = song.artist || undefined
    let releaseDate: string | undefined

    let genre: string | undefined
    if (albumRes.ok) {
      const albumData = (await albumRes.json()) as SubsonicGetAlbumResponse
      const album = albumData['subsonic-response']?.album
      if (album) {
        mbid = album.musicBrainzId || undefined
        albumTitle = album.name || albumTitle
        albumArtist = album.artist || albumArtist
        genre = album.genre || undefined
        if (album.originalReleaseDate) {
          releaseDate = formatItemDate(album.originalReleaseDate)
        }
      }
    }

    return {
      relativeUrl: `/app/#/album/${albumId}/show`,
      mbid,
      albumTitle,
      artist: albumArtist,
      releaseDate,
      genre,
    }
  } catch {
    return undefined
  }
}
