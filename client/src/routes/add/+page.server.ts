import type { PageServerLoad } from './$types'
import { createServerTRPCClient } from '$lib/trpc/client.server'
import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'
import { TRPCClientError } from '@trpc/client'

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('access_token')
  const trpc = createServerTRPCClient(token)

  try {
    const [enabledServices, availableServices] = await Promise.all([
      trpc.navidrome.getEnabledServices.query(),
      trpc.navidrome.getAvailableServices.query(),
    ])
    return { enabledServices, availableServices }
  } catch (error) {
    if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
      throw redirect(307, resolve('/auth/login'))
    }
    throw error
  }
}
