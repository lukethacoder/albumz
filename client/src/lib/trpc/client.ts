import { createAppTRPCClient } from './factory'
import { env } from '$env/dynamic/public'

function getBrowserToken(): string | undefined {
  if (typeof document === 'undefined') return undefined

  // Try to get token from cookie first
  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('access_token='))
    ?.split('=')[1]

  // Fallback to localStorage if cookie is not available
  return cookieToken || localStorage.getItem('albumz_access_token') || undefined
}

// Browser-side tRPC client
export const trpc = createAppTRPCClient({
  apiUrl: env.PUBLIC_API_URL ?? '',
  getToken: getBrowserToken,
})
