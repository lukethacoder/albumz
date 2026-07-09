import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../../api/src/trpc/root'

export interface TRPCClientOptions {
  /** Base URL of the API (without the trailing `/trpc`). */
  apiUrl: string
  /**
   * Resolves the auth token for a request, or `undefined` when unauthenticated.
   * Called per request so token sources can vary (cookie, localStorage, etc.).
   */
  getToken: () => string | undefined
}

/**
 * Single source of truth for constructing a tRPC client. Environment-specific
 * concerns (which URL, where the token comes from) are injected via options so
 * the browser and server adapters stay thin.
 */
export function createAppTRPCClient({ apiUrl, getToken }: TRPCClientOptions) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        transformer: superjson,
        headers: () => {
          const token = getToken()
          return token ? { authorization: `Bearer ${token}` } : {}
        },
      }),
    ],
  })
}
