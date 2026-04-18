import type { PageServerLoad } from './$types'
import { createServerTRPCClient } from '$lib/trpc/client.server'
import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'
import { TRPCClientError } from '@trpc/client'

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('access_token')
  const trpc = createServerTRPCClient(token)

  // Parse URL search params for filters
  const search = url.searchParams.get('search') || undefined
  const minYear = url.searchParams.get('minYear')
    ? parseInt(url.searchParams.get('minYear')!)
    : undefined
  const maxYear = url.searchParams.get('maxYear')
    ? parseInt(url.searchParams.get('maxYear')!)
    : undefined
  const completionFilter = (url.searchParams.get('completionFilter') as 'all' | 'backlog' | 'listened') || 'backlog'
  const sortBy =
    (url.searchParams.get('sortBy') as
      | 'dateAddedDesc'
      | 'dateAddedAsc'
      | 'releaseDateDesc'
      | 'releaseDateAsc'
      | null) || 'dateAddedDesc'
  const genresParam = url.searchParams.get('genres')
  const genres = genresParam ? genresParam.split(',').filter(Boolean) : undefined

  try {
    // Get filtered albums
    const albums = await trpc.albums.list.query({
      search,
      minYear,
      maxYear,
      completionFilter,
      sortBy,
      genres,
    })

    // Get all albums (unfiltered) to extract available years/genres
    const allAlbums = await trpc.albums.list.query({
      completionFilter: 'all',
      sortBy: 'dateAddedDesc',
    })

    // Extract unique years from all albums
    const availableYears = Array.from(
      new Set(
        allAlbums
          .map((album) => {
            if (album.releaseDate) {
              const year = new Date(album.releaseDate).getFullYear()
              return !isNaN(year) ? year : null
            }
            return null
          })
          .filter((year): year is number => year !== null),
      ),
    ).sort((a, b) => b - a)

    const availableGenres = Array.from(
      new Set(
        allAlbums.flatMap((album) =>
          album.genre ? album.genre.split(';').map((g) => g.trim()).filter(Boolean) : [],
        ),
      ),
    ).sort()

    const viewMode = cookies.get('viewMode') === 'table' ? 'table' : ('grid' as const)

    return { albums, availableYears, availableGenres, viewMode }
  } catch (error) {
    console.log('error ', error)
    if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
      throw redirect(307, resolve('/auth/login'))
    }
    throw error
  }
}
