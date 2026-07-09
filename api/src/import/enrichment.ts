/**
 * Pure domain rules for the import pipeline. No I/O — every function here is a
 * deterministic transform, which is where the app's real behaviour (cover-art
 * priority, genre suppression, numeric-genre cleanup) is pinned down and
 * tested.
 */

/** A "genre" that is really a decade/year, e.g. `1990` or `80s` — junk tagging. */
export function isNumericGenre(genre?: string): boolean {
  if (!genre) return false
  return /^\d+s?$/.test(genre.trim())
}

export function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Accumulates genres from multiple sources, `;`-separated. Numeric "genres"
 * are dropped, duplicates are filtered case-insensitively, and newly-added
 * genres are title-cased. Genres already present (e.g. from the source
 * metadata) are preserved verbatim.
 */
export class GenreSet {
  private readonly set: Set<string>

  constructor(initial?: string) {
    this.set = new Set(
      (initial ?? '')
        .split(';')
        .map((g) => g.trim())
        .filter(Boolean),
    )
  }

  add(raw: string | undefined): void {
    if (!raw) return
    raw
      .split(';')
      .map((g) => g.trim())
      .filter(Boolean)
      .forEach((g) => {
        if (
          !isNumericGenre(g) &&
          ![...this.set].some((e) => e.toLowerCase() === g.toLowerCase())
        ) {
          this.set.add(toTitleCase(g))
        }
      })
  }

  get size(): number {
    return this.set.size
  }

  /** `;`-joined genres, or `undefined` when empty. */
  toValue(): string | undefined {
    return this.set.size > 0 ? [...this.set].join(';') : undefined
  }
}

/**
 * Resolves the winning cover-art URL from the available candidates.
 *
 * For Spotify sources the Spotify image is preferred (highest quality), so it
 * wins over Last.fm / Cover Art Archive. For every other source Last.fm is
 * preferred, then Cover Art Archive, then the source's own image (e.g. a
 * YouTube thumbnail) as a last resort.
 */
export function resolveCoverArt(opts: {
  isSpotify: boolean
  sourceCover?: string
  lastFmCover?: string
  caaCover?: string
}): string | undefined {
  const { isSpotify, sourceCover, lastFmCover, caaCover } = opts
  if (isSpotify) {
    return sourceCover ?? lastFmCover ?? caaCover
  }
  return lastFmCover ?? caaCover ?? sourceCover
}

/** Spotify's genre tagging is poor, so it is never trusted. */
export function isSpotifySource(kind: string): boolean {
  return kind === 'spotify_album' || kind === 'spotify_track'
}
