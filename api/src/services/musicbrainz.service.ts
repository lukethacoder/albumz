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
