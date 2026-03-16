import { ENV } from 'varlock/env'
import { client } from './generated/client.gen'
import { authStore } from '$lib/stores/auth.svelte'

// Configure API client with public URL
client.setConfig({
	baseUrl: ENV.PUBLIC_API_URL
})

// Intercept requests to add auth header
const originalFetch = client.fetch
client.fetch = async (request: Request | string, init?: RequestInit) => {
	const token = authStore.accessToken

	if (token) {
		const headers = new Headers(init?.headers)
		headers.set('Authorization', `Bearer ${token}`)

		const newInit: RequestInit = {
			...init,
			headers
		}

		return originalFetch(request, newInit)
	}

	return originalFetch(request, init)
}

export { client }
export * from './generated'
