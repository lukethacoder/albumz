import type { PageServerLoad } from './$types'
import { createServerTRPCClient } from '$lib/trpc/client.server'
import { redirect } from '@sveltejs/kit'
import { resolve } from '$app/paths'

export const load: PageServerLoad = async () => {
  const trpc = createServerTRPCClient()
  const hasUsers = await trpc.auth.hasUsers.query()

  if (hasUsers) {
    redirect(302, resolve('/auth/login'))
  }
}
