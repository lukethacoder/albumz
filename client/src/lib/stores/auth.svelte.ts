import { browser } from '$app/environment'
import type { AuthResponseDto } from '$lib/api/generated'

const TOKEN_KEY = 'albumz_access_token'

interface AuthState {
	user: {
		id: string
		email: string
		username?: string
	} | null
	accessToken: string | null
	isAuthenticated: boolean
}

function createAuthStore() {
	// Initialize state from localStorage if in browser
	const initialToken = browser ? localStorage.getItem(TOKEN_KEY) : null

	let state = $state<AuthState>({
		user: null,
		accessToken: initialToken,
		isAuthenticated: !!initialToken
	})

	return {
		get user() {
			return state.user
		},
		get accessToken() {
			return state.accessToken
		},
		get isAuthenticated() {
			return state.isAuthenticated
		},

		setAuth(authData: AuthResponseDto) {
			state.user = authData.user
			state.accessToken = authData.accessToken
			state.isAuthenticated = true

			if (browser) {
				localStorage.setItem(TOKEN_KEY, authData.accessToken)
			}
		},

		clearAuth() {
			state.user = null
			state.accessToken = null
			state.isAuthenticated = false

			if (browser) {
				localStorage.removeItem(TOKEN_KEY)
			}
		},

		// Restore user data from token (call this on app load if token exists)
		async restoreSession() {
			if (!state.accessToken) {
				return false
			}

			try {
				// Dynamic import to avoid circular dependency
				const { authControllerGetProfile } = await import('$lib/api')

				const { data, error } = await authControllerGetProfile()

				if (error || !data) {
					this.clearAuth()
					return false
				}

				state.user = {
					id: data.id,
					email: data.email,
					username: data.username
				}

				return true
			} catch {
				this.clearAuth()
				return false
			}
		}
	}
}

export const authStore = createAuthStore()
