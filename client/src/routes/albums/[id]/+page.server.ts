import type { PageServerLoad } from './$types'
import { albumControllerFindById, client } from '$lib/api/client.server'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = cookies.get('access_token')

  const { data, error } = await albumControllerFindById({
    client,
    path: {
      id: params.id,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (error) {
    console.log('error ', error)
    throw error
  }

  return { album: data }
}
