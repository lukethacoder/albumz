import { client } from '$lib/api'

// initialise the client on the client
client.setConfig({
  baseUrl: import.meta.env.PUBLIC_API_URL ?? 'http://localhost:4000',
})
