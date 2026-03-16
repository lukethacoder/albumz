<script lang="ts">
  import { goto } from '$app/navigation'
  import { authControllerLogin } from '$lib/api'
  import { authStore } from '$lib/stores/auth.svelte'

  let email = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let loading = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = null

    try {
      const { data, error: apiError } = await authControllerLogin({
        body: { email, password },
      })

      if (apiError || !data) {
        error = 'Invalid email or password'
        return
      }

      authStore.setAuth(data)
      goto('/')
    } catch (err) {
      error = 'An error occurred. Please try again.'
      console.error('Login error:', err)
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Login - Albumz</title>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
  <div class="w-full space-y-8">
    <div>
      <h1 class="text-3xl font-bold">Sign in to your account</h1>
      <p class="mt-2 text-sm text-gray-600">
        Or
        <a href="/auth/register" class="font-medium text-blue-600 hover:text-blue-500">
          create a new account
        </a>
      </p>
    </div>

    <form onsubmit={handleSubmit} class="mt-8 space-y-6">
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{error}</p>
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={password}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  </div>
</div>
