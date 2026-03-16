import { ENV } from 'varlock/env'
import { client } from '$lib/api'

// initialise the client on the client
client.setConfig({
  baseUrl: ENV.PUBLIC_API_URL,
})
