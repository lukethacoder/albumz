const MB_BASE = 'https://musicbrainz.org/ws/2'
const MB_HEADERS = {
  'User-Agent': 'Albumz/1.0 (https://github.com/lukethacoder/albumz)',
  Accept: 'application/json',
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mbFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(`${MB_BASE}${path}`, { headers: MB_HEADERS })
  if (!res.ok) return null
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
  try {
    await sleep(300)
    const query = `artist:"${artist}" releasegroup:"${album}"`
    const data = await mbFetch<{
      'release-groups'?: Array<{ id: string }>
    }>(`/release-group/?query=${encodeURIComponent(query)}&limit=5&fmt=json`)
    if (!data?.['release-groups']?.length) return []

    const results: string[] = []
    for (const rg of data['release-groups'].slice(0, 3)) {
      await sleep(300)
      try {
        const caaRes = await fetch(
          `https://coverartarchive.org/release-group/${rg.id}`,
          { headers: { Accept: 'application/json' } },
        )
        if (!caaRes.ok) continue
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
      } catch {
        // skip this release-group
      }
    }
    return results
  } catch {
    return []
  }
}

export async function fetchMusicBrainzGenres(
  artist: string,
  album: string,
): Promise<string | undefined> {
  try {
    await sleep(300)
    const query = `artist:"${artist}" releasegroup:"${album}"`
    const searchData = await mbFetch<{
      'release-groups'?: Array<{ id: string }>
    }>(`/release-group/?query=${encodeURIComponent(query)}&limit=1&fmt=json`)

    const rgId = searchData?.['release-groups']?.[0]?.id
    if (!rgId) return undefined

    await sleep(300)
    const rgData = await mbFetch<{
      genres?: Array<{ name: string; count: number }>
    }>(`/release-group/${rgId}?inc=genres&fmt=json`)

    const genres = rgData?.genres ?? []
    if (!genres.length) return undefined

    return genres
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((g) => g.name)
      .join(';')
  } catch {
    return undefined
  }
}

export async function enrichFromMusicBrainz(
  releaseMbid: string,
): Promise<MusicBrainzUrlRels> {
  const { releaseGroupId, urlRels: releaseUrls } =
    await getReleaseData(releaseMbid)

  if (!releaseGroupId) return releaseUrls

  const groupUrls = await getReleaseGroupUrls(releaseGroupId)

  // Merge both sources — fill any gaps in release-group data with release data
  return {
    urlSpotify: groupUrls.urlSpotify ?? releaseUrls.urlSpotify,
    urlAppleMusic: groupUrls.urlAppleMusic ?? releaseUrls.urlAppleMusic,
    urlYoutube: groupUrls.urlYoutube ?? releaseUrls.urlYoutube,
    urlYoutubeMusic: groupUrls.urlYoutubeMusic ?? releaseUrls.urlYoutubeMusic,
    urlRateYourMusic:
      groupUrls.urlRateYourMusic ?? releaseUrls.urlRateYourMusic,
    releaseGroupMbid: releaseGroupId,
  }
}
