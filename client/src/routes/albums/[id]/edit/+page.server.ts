import type { PageServerLoad } from './$types'
import { createServerTRPCClient } from '$lib/trpc/client.server'
import { deriveFilterOptions } from '$lib/loaders'
import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'
import { TRPCClientError } from '@trpc/client'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token')
  const trpc = createServerTRPCClient(token)

  try {
    const [album, allAlbums] = await Promise.all([
      trpc.albums.getById.query({ id: params.id }),
      trpc.albums.list.query({ completionFilter: 'all', sortBy: 'dateAddedDesc' }),
    ])

    const { availableGenres } = deriveFilterOptions(allAlbums)

    return { album, availableGenres }
  } catch (error) {
    if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
      throw redirect(307, resolve('/auth/login'))
    }
    throw error
  }
}
