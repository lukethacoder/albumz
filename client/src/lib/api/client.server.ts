import { API_URL } from '$env/static/private'
import { client } from './generated/client.gen'

// Server-side only: Configure API client with internal Docker service name
console.log('🔧 API Client Config (Server):', { API_URL })

client.setConfig({
  baseUrl: API_URL,
})

export { client }
export * from './generated'
