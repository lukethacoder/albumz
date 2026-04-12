import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../../api/src/trpc/root'
import { env } from '$env/dynamic/private'

// Server-side tRPC client factory
// Accepts optional auth token to forward from cookies
export function createServerTRPCClient(token?: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.API_URL}/trpc`,
        transformer: superjson,
        headers: token
          ? {
              authorization: `Bearer ${token}`,
            }
          : {},
      }),
    ],
  })
}
