import { ENV } from 'varlock/env'
import { client } from './generated/client.gen'

// Server-side only: Configure API client with API URL
client.setConfig({
  baseUrl: ENV.API_URL,
})

export { client }
export * from './generated'
