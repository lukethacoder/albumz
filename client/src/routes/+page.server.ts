import type { PageServerLoad } from './$types'
import { albumControllerFindAll, client } from '$lib/api/client.server'
import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('access_token')

  const { data, error } = await albumControllerFindAll({
    client,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (error) {
    console.log('error ', error)
    if (error?.statusCode === 401) {
      throw redirect(307, resolve('/auth/login'))
    }
    throw error
  }

  return { albums: data }
}
