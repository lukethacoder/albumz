import { z } from 'zod'

const completionFilterSchema = z.enum(['all', 'backlog', 'listened']).catch('backlog')

const sortBySchema = z
  .enum(['dateAddedDesc', 'dateAddedAsc', 'releaseDateDesc', 'releaseDateAsc'])
  .catch('dateAddedDesc')

// A year coerced from a query string; junk (NaN, out of range) degrades to undefined.
const yearSchema = z
  .preprocess((value) => {
    if (typeof value !== 'string' || value.trim() === '') return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) ? parsed : undefined
  }, z.number().int().min(1900).max(2100).optional())
  .catch(undefined)

const searchSchema = z
  .preprocess(
    (value) => (typeof value === 'string' && value !== '' ? value : undefined),
    z.string().optional(),
  )
  .catch(undefined)

const genresSchema = z
  .preprocess((value) => {
    if (typeof value !== 'string') return undefined
    const parsed = value.split(',').filter(Boolean)
    return parsed.length > 0 ? parsed : undefined
  }, z.array(z.string()).optional())
  .catch(undefined)

const albumFiltersSchema = z.object({
  search: searchSchema,
  minYear: yearSchema,
  maxYear: yearSchema,
  completionFilter: completionFilterSchema,
  sortBy: sortBySchema,
  genres: genresSchema,
})

export type AlbumFilters = z.infer<typeof albumFiltersSchema>

/**
 * Parse album list filters out of a URL's search params, validating and
 * coercing each value. Invalid/missing params degrade to sensible defaults
 * (or `undefined`) rather than surfacing `NaN` or bogus enum values.
 */
export function parseAlbumFilters(url: URL): AlbumFilters {
  const params = url.searchParams
  return albumFiltersSchema.parse({
    search: params.get('search') ?? undefined,
    minYear: params.get('minYear') ?? undefined,
    maxYear: params.get('maxYear') ?? undefined,
    completionFilter: params.get('completionFilter') ?? undefined,
    sortBy: params.get('sortBy') ?? undefined,
    genres: params.get('genres') ?? undefined,
  })
}

// Minimal shape needed to derive filter options; keeps the helper decoupled
// from the full album row type.
interface AlbumFilterSource {
  releaseDate?: string | Date | null
  genre?: string | null
}

export interface FilterOptions {
  availableYears: number[]
  availableGenres: string[]
}

/**
 * Derive the distinct years (desc) and genres (asc) available across a set of
 * albums. Genres are stored as semicolon-delimited strings and are split,
 * trimmed, and de-duplicated here.
 */
export function deriveFilterOptions(albums: AlbumFilterSource[]): FilterOptions {
  const availableYears = Array.from(
    new Set(
      albums
        .map((album) => {
          if (!album.releaseDate) return null
          const year = new Date(album.releaseDate).getFullYear()
          return Number.isNaN(year) ? null : year
        })
        .filter((year): year is number => year !== null),
    ),
  ).sort((a, b) => b - a)

  const availableGenres = Array.from(
    new Set(
      albums.flatMap((album) =>
        album.genre
          ? album.genre
              .split(';')
              .map((g) => g.trim())
              .filter(Boolean)
          : [],
      ),
    ),
  ).sort()

  return { availableYears, availableGenres }
}
