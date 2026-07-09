import { browser } from '$app/environment'

const TOKEN_KEY = 'albumz_access_token'

interface AuthResponseDto {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: {
    id: string
    email: string
    username?: string
  }
}

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

  const state = $state<AuthState>({
    user: null,
    accessToken: initialToken,
    isAuthenticated: !!initialToken,
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
        // Set cookie for server-side access
        document.cookie = `access_token=${authData.accessToken}; path=/; max-age=${authData.expiresIn}; SameSite=Lax`
      }
    },

    clearAuth() {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false

      if (browser) {
        localStorage.removeItem(TOKEN_KEY)
        // Clear the cookie
        document.cookie = 'access_token=; path=/; max-age=0'
      }
    },

    // Restore user data from token (call this on app load if token exists)
    async restoreSession() {
      if (!state.accessToken) {
        return false
      }

      try {
        // Dynamic import to avoid circular dependency
        const { trpc } = await import('$lib/trpc/client')

        const data = await trpc.auth.profile.query()

        if (!data) {
          this.clearAuth()
          return false
        }

        state.user = {
          id: data.id,
          email: data.email,
          username: data.username ?? undefined,
        }

        return true
      } catch {
        this.clearAuth()
        return false
      }
    },
  }
}

export const authStore = createAuthStore()
