const MB_BASE = 'https://musicbrainz.org/ws/2'
const MB_HEADERS = {
  'User-Agent': 'Albumz/1.0 (https://github.com/lukethacoder/albumz)',
  Accept: 'application/json',
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mbFetch<T>(path: string): Promise<T | null> {
  const url = `${MB_BASE}${path}`
  console.log(`[musicbrainz] GET ${url}`)
  const res = await fetch(url, { headers: MB_HEADERS })
  if (!res.ok) {
    console.warn(`[musicbrainz] ${res.status} ${res.statusText} — ${url}`)
    return null
  }
  return res.json() as Promise<T>
}

export interface MusicBrainzUrlRels {
  urlSpotify?: string
  urlAppleMusic?: string
  urlYoutube?: string
  urlYoutubeMusic?: string
  urlRateYourMusic?: string
  releaseGroupMbid?: string
}

function extractUrlRels(
  relations: Array<{ url?: { resource: string } }>,
): MusicBrainzUrlRels {
  const result: MusicBrainzUrlRels = {}

  for (const rel of relations) {
    const resource = rel.url?.resource
    if (!resource) continue

    if (resource.includes('open.spotify.com')) {
      result.urlSpotify = resource
    } else if (
      resource.includes('music.apple.com') ||
      resource.includes('itunes.apple.com')
    ) {
      result.urlAppleMusic = resource
    } else if (resource.includes('music.youtube.com')) {
      result.urlYoutubeMusic = resource
    } else if (
      resource.includes('youtube.com') ||
      resource.includes('youtu.be')
    ) {
      result.urlYoutube = resource
    } else if (resource.includes('rateyourmusic.com')) {
      result.urlRateYourMusic = resource
    }
  }

  return result
}

async function getReleaseData(releaseMbid: string): Promise<{
  releaseGroupId: string | null
  urlRels: MusicBrainzUrlRels
}> {
  await sleep(300)
  const data = await mbFetch<{
    'release-group'?: { id: string }
    relations?: Array<{ url?: { resource: string } }>
  }>(`/release/${releaseMbid}?inc=release-groups+url-rels&fmt=json`)

  return {
    releaseGroupId: data?.['release-group']?.id ?? null,
    urlRels: data?.relations ? extractUrlRels(data.relations) : {},
  }
}

async function getReleaseGroupUrls(
  releaseGroupMbid: string,
): Promise<MusicBrainzUrlRels> {
  await sleep(300)
  const data = await mbFetch<{
    relations?: Array<{ url?: { resource: string } }>
  }>(`/release-group/${releaseGroupMbid}?inc=url-rels&fmt=json`)
  if (!data?.relations) return {}
  return extractUrlRels(data.relations)
}

export async function searchMusicBrainzArtwork(
  artist: string,
  album: string,
): Promise<string[]> {
  console.log(`[musicbrainz] searchArtwork artist="${artist}" album="${album}"`)
  try {
    await sleep(300)
    const query = `artist:"${artist}" releasegroup:"${album}"`
    const data = await mbFetch<{
      'release-groups'?: Array<{ id: string }>
    }>(`/release-group/?query=${encodeURIComponent(query)}&limit=5&fmt=json`)
    if (!data?.['release-groups']?.length) {
      console.log(`[musicbrainz] searchArtwork — no release groups found`)
      return []
    }

    const results: string[] = []
    for (const rg of data['release-groups'].slice(0, 3)) {
      await sleep(300)
      try {
        const caaUrl = `https://coverartarchive.org/release-group/${rg.id}`
        console.log(`[musicbrainz] CAA GET ${caaUrl}`)
        const caaRes = await fetch(caaUrl, {
          headers: { Accept: 'application/json' },
        })
        if (!caaRes.ok) {
          console.warn(
            `[musicbrainz] CAA ${caaRes.status} for release-group ${rg.id}`,
          )
          continue
        }
        const caaData = (await caaRes.json()) as {
          images?: Array<{
            front: boolean
            image: string
            thumbnails: { '1200'?: string; large?: string; '500'?: string }
          }>
        }
        const front =
          caaData.images?.find((img) => img.front) ?? caaData.images?.[0]
        if (!front) continue
        results.push(
          front.thumbnails['1200'] ??
            front.thumbnails.large ??
            front.thumbnails['500'] ??
            front.image,
        )
      } catch (err) {
        console.warn(`[musicbrainz] CAA error for release-group ${rg.id}`, err)
      }
    }
    console.log(
      `[musicbrainz] searchArtwork — found ${results.length} image(s)`,
    )
    return results
  } catch (err) {
    console.error(`[musicbrainz] searchArtwork error`, err)
    return []
  }
}

async function fetchGenresByReleaseGroupId(
  rgId: string,
): Promise<string | undefined> {
  await sleep(300)
  const rgData = await mbFetch<{
    genres?: Array<{ name: string; count: number }>
  }>(`/release-group/${rgId}?inc=genres&fmt=json`)

  const genres = rgData?.genres ?? []
  if (!genres.length) {
    console.log(`[musicbrainz] fetchGenres — no genres for rgId=${rgId}`)
    return undefined
  }

  const result = genres
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((g) => g.name)
    .join(';')
  console.log(`[musicbrainz] fetchGenres — result: "${result}"`)
  return result
}

export async function fetchMusicBrainzGenresBySearch(
  artist: string,
  album: string,
): Promise<string | undefined> {
  const primaryArtist = artist.split(';')[0].trim()
  console.log(
    `[musicbrainz] fetchGenresBySearch artist="${primaryArtist}" album="${album}"`,
  )
  try {
    await sleep(300)
    const query = `artist:"${primaryArtist}" releasegroup:"${album}"`
    const searchData = await mbFetch<{
      'release-groups'?: Array<{ id: string }>
    }>(`/release-group/?query=${encodeURIComponent(query)}&limit=1&fmt=json`)

    const rgId = searchData?.['release-groups']?.[0]?.id
    if (!rgId) {
      console.log(`[musicbrainz] fetchGenresBySearch — no release group found`)
      return undefined
    }

    return fetchGenresByReleaseGroupId(rgId)
  } catch (err) {
    console.error(`[musicbrainz] fetchGenresBySearch error`, err)
    return undefined
  }
}

export async function fetchMusicBrainzGenresByMbid(
  releaseMbid: string,
): Promise<string | undefined> {
  console.log(
    `[musicbrainz] fetchGenresByMbid releaseMbid=${releaseMbid}`,
  )
  try {
    const { releaseGroupId } = await getReleaseData(releaseMbid)
    if (!releaseGroupId) {
      console.log(`[musicbrainz] fetchGenresByMbid — no release group found`)
      return undefined
    }

    return fetchGenresByReleaseGroupId(releaseGroupId)
  } catch (err) {
    console.error(`[musicbrainz] fetchGenresByMbid error`, err)
    return undefined
  }
}

export async function enrichFromMusicBrainz(
  releaseMbid: string,
): Promise<MusicBrainzUrlRels> {
  console.log(`[musicbrainz] enrich releaseMbid=${releaseMbid}`)
  const { releaseGroupId, urlRels: releaseUrls } =
    await getReleaseData(releaseMbid)

  if (!releaseGroupId) {
    console.log(`[musicbrainz] enrich — no release group found`)
    return releaseUrls
  }

  const groupUrls = await getReleaseGroupUrls(releaseGroupId)

  const result = {
    urlSpotify: groupUrls.urlSpotify ?? releaseUrls.urlSpotify,
    urlAppleMusic: groupUrls.urlAppleMusic ?? releaseUrls.urlAppleMusic,
    urlYoutube: groupUrls.urlYoutube ?? releaseUrls.urlYoutube,
    urlYoutubeMusic: groupUrls.urlYoutubeMusic ?? releaseUrls.urlYoutubeMusic,
    urlRateYourMusic:
      groupUrls.urlRateYourMusic ?? releaseUrls.urlRateYourMusic,
    releaseGroupMbid: releaseGroupId,
  }
  console.log(`[musicbrainz] enrich — result`, result)
  return result
}
