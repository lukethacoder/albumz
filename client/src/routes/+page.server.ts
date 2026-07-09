import type { PageServerLoad } from './$types'
import { createServerTRPCClient } from '$lib/trpc/client.server'
import { parseAlbumFilters, deriveFilterOptions } from '$lib/loaders'
import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'
import { TRPCClientError } from '@trpc/client'

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('access_token')
  const trpc = createServerTRPCClient(token)

  const filters = parseAlbumFilters(url)

  try {
    // Get filtered albums
    const albums = await trpc.albums.list.query(filters)

    // Get all albums (unfiltered) to extract available years/genres
    const allAlbums = await trpc.albums.list.query({
      completionFilter: 'all',
      sortBy: 'dateAddedDesc',
    })

    const { availableYears, availableGenres } = deriveFilterOptions(allAlbums)

    const viewMode: 'grid' | 'table' = cookies.get('viewMode') === 'table' ? 'table' : 'grid'

    return { albums, availableYears, availableGenres, viewMode }
  } catch (error) {
    console.log('error ', error)
    if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
      throw redirect(307, resolve('/auth/login'))
    }
    throw error
  }
}
