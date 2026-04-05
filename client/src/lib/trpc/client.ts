import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../../api/src/trpc/root'
import { PUBLIC_API_URL } from '$env/static/public'

// Browser-side tRPC client
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${PUBLIC_API_URL}/trpc`,
      transformer: superjson,
      // Add headers for authentication (will be set by the caller)
      headers: () => {
        let token: string | undefined

        if (typeof document !== 'undefined') {
          // Try to get token from cookie first
          token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('access_token='))
            ?.split('=')[1]

          // Fallback to localStorage if cookie is not available
          if (!token) {
            token = localStorage.getItem('albumz_access_token') || undefined
          }
        }

        return token
          ? {
              authorization: `Bearer ${token}`,
            }
          : {}
      },
    }),
  ],
})
