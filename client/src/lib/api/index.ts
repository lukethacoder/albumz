import { PUBLIC_API_URL } from '$env/static/public'
import { client } from './generated/client.gen'

// Browser-side only: Configure API client with public URL
console.log('🔧 API Client Config (Browser):', { PUBLIC_API_URL })

client.setConfig({
  baseUrl: PUBLIC_API_URL,
})

export { client }
export * from './generated'
