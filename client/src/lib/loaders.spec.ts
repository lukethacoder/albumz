import { describe, it, expect } from 'vitest'
import { parseAlbumFilters, deriveFilterOptions } from './loaders'

function makeUrl(query: string): URL {
  return new URL(`http://localhost${query}`)
}

describe('parseAlbumFilters', () => {
  it('parses a fully-populated query string', () => {
    const url = makeUrl(
      '?search=daft&minYear=1995&maxYear=2005&completionFilter=listened&sortBy=releaseDateAsc&genres=house,techno',
    )
    expect(parseAlbumFilters(url)).toEqual({
      search: 'daft',
      minYear: 1995,
      maxYear: 2005,
      completionFilter: 'listened',
      sortBy: 'releaseDateAsc',
      genres: ['house', 'techno'],
    })
  })

  it('applies defaults when params are missing', () => {
    const filters = parseAlbumFilters(makeUrl(''))
    expect(filters).toEqual({
      search: undefined,
      minYear: undefined,
      maxYear: undefined,
      completionFilter: 'backlog',
      sortBy: 'dateAddedDesc',
      genres: undefined,
    })
  })

  it('degrades junk year values to undefined rather than NaN', () => {
    const filters = parseAlbumFilters(makeUrl('?minYear=notayear&maxYear=99.5'))
    expect(filters.minYear).toBeUndefined()
    expect(filters.maxYear).toBeUndefined()
  })

  it('clamps out-of-range years to undefined', () => {
    const filters = parseAlbumFilters(makeUrl('?minYear=1000&maxYear=3000'))
    expect(filters.minYear).toBeUndefined()
    expect(filters.maxYear).toBeUndefined()
  })

  it('falls back to defaults for invalid enum values', () => {
    const filters = parseAlbumFilters(makeUrl('?completionFilter=garbage&sortBy=nonsense'))
    expect(filters.completionFilter).toBe('backlog')
    expect(filters.sortBy).toBe('dateAddedDesc')
  })

  it('treats empty strings as absent', () => {
    const filters = parseAlbumFilters(makeUrl('?search=&genres='))
    expect(filters.search).toBeUndefined()
    expect(filters.genres).toBeUndefined()
  })
})

describe('deriveFilterOptions', () => {
  it('splits semicolon-delimited genres, trims, and de-duplicates', () => {
    const { availableGenres } = deriveFilterOptions([
      { genre: 'Rock; Pop', releaseDate: null },
      { genre: 'pop ;  Jazz', releaseDate: null },
    ])
    expect(availableGenres).toEqual(['Jazz', 'Pop', 'Rock', 'pop'])
  })

  it('ignores empty and null genres', () => {
    const { availableGenres } = deriveFilterOptions([
      { genre: null, releaseDate: null },
      { genre: '', releaseDate: null },
      { genre: ';;', releaseDate: null },
      { genre: 'Ambient', releaseDate: null },
    ])
    expect(availableGenres).toEqual(['Ambient'])
  })

  it('extracts distinct years sorted descending', () => {
    const { availableYears } = deriveFilterOptions([
      { genre: null, releaseDate: '2001-06-01' },
      { genre: null, releaseDate: '1999-01-15' },
      { genre: null, releaseDate: '2001-12-31' },
      { genre: null, releaseDate: '2010-03-03' },
    ])
    expect(availableYears).toEqual([2010, 2001, 1999])
  })

  it('skips null and invalid release dates', () => {
    const { availableYears } = deriveFilterOptions([
      { genre: null, releaseDate: null },
      { genre: null, releaseDate: 'not-a-date' },
      { genre: null, releaseDate: '2005-05-05' },
    ])
    expect(availableYears).toEqual([2005])
  })

  it('returns empty arrays for an empty album list', () => {
    expect(deriveFilterOptions([])).toEqual({
      availableYears: [],
      availableGenres: [],
    })
  })
})
