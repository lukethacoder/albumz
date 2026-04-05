<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { trpc } from '$lib/trpc/client'
  import { authStore } from '$lib/stores/auth.svelte'
  import { TRPCClientError } from '@trpc/client'

  let email = $state('')
  let password = $state('')
  let username = $state('')
  let error = $state<string | null>(null)
  let loading = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = null

    if (password.length < 8) {
      error = 'Password must be at least 8 characters long'
      loading = false
      return
    }

    try {
      const data = await trpc.auth.register.mutate({
        email,
        password,
        username,
      })

      if (!data) {
        error = 'Registration failed. Please try again.'
        return
      }

      authStore.setAuth(data)
      goto(resolve('/'))
    } catch (err) {
      if (err instanceof TRPCClientError) {
        error = err.message || 'Registration failed. Email may already be in use.'
      } else {
        error = 'An error occurred. Please try again.'
      }
      console.error('Registration error:', err)
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Register - Albumz</title>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
  <div class="w-full space-y-8">
    <div>
      <h1 class="text-3xl font-bold">Create your account</h1>
      <p class="mt-2 text-sm text-gray-600">
        Already have an account?
        <a
          href={resolve('/auth/login')}
          class="font-medium text-emerald-600 hover:text-emerald-500"
        >
          Sign in
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
            class="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700"> Username </label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            required
            bind:value={username}
            class="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            bind:value={password}
            class="mt-1 block w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
          />
          <p class="mt-1 text-sm text-gray-500">Must be at least 8 characters</p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          class="flex w-full justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  </div>
</div>
