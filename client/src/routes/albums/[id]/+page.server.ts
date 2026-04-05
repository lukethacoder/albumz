import type { PageServerLoad } from './$types'
import { createServerTRPCClient } from '$lib/trpc/client.server'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token')
  const trpc = createServerTRPCClient(token)

  try {
    const album = await trpc.albums.getById.query({ id: params.id })
    return { album }
  } catch (error) {
    console.log('error ', error)
    throw error
  }
}
