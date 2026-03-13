import type { PageServerLoad } from './$types'
import { albumControllerFindAll, client } from '$lib/api/client.server'

export const load: PageServerLoad = async ({ cookies }) => {
  console.log('cookies ', cookies)
  // const token = cookies.get('access_token')

  const { data, error } = await albumControllerFindAll({
    client,
    // headers: {
    //   Authorization: `Bearer ${token}`,
    // },
  })

  if (error) {
    console.log('error ', error)
    throw error
  }

  return { albums: data }
}
