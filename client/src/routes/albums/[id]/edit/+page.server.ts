import type { PageServerLoad } from './$types'
import { createServerTRPCClient } from '$lib/trpc/client.server'
import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'
import { TRPCClientError } from '@trpc/client'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token')
  const trpc = createServerTRPCClient(token)

  try {
    const [album, allAlbums] = await Promise.all([
      trpc.albums.getById.query({ id: params.id }),
      trpc.albums.list.query({ showCompleted: true, sortBy: 'dateAddedDesc' }),
    ])

    const availableGenres = Array.from(
      new Set(
        allAlbums.flatMap((a) =>
          a.genre ? a.genre.split(';').map((g) => g.trim()).filter(Boolean) : [],
        ),
      ),
    ).sort()

    return { album, availableGenres }
  } catch (error) {
    if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
      throw redirect(307, resolve('/auth/login'))
    }
    throw error
  }
}
