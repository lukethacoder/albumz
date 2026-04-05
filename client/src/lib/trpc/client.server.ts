import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../../api/src/trpc/root'
import { API_URL } from '$env/static/private'

// Server-side tRPC client factory
// Accepts optional auth token to forward from cookies
export function createServerTRPCClient(token?: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
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
