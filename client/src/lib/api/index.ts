import { ENV } from 'varlock/env'
import { client } from './generated/client.gen'

// Browser-side only: Configure API client with public URL
client.setConfig({
  baseUrl: ENV.PUBLIC_API_URL,
})

export { client }
export * from './generated'
