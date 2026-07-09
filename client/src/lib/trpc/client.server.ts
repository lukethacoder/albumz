import { createAppTRPCClient } from './factory'
import { env } from '$env/dynamic/private'

// Server-side tRPC client factory
// Accepts optional auth token to forward from cookies
export function createServerTRPCClient(token?: string) {
  return createAppTRPCClient({
    apiUrl: env.API_URL,
    getToken: () => token,
  })
}
