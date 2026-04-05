<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { trpc } from '$lib/trpc/client'
  import { Button } from '$lib/components'
  import { m } from '$lib/paraglide/messages'
  import { authStore } from '$lib/stores/auth.svelte'
  import { ENV } from 'varlock/env'
  import { TRPCClientError } from '@trpc/client'

  let email = $state(ENV.VARLOCK_ENV === 'development' ? 'admin@albumz.local' : '')
  let password = $state(ENV.VARLOCK_ENV === 'development' ? 'password' : '')
  let error = $state<string | null>(null)
  let loading = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = null

    try {
      const data = await trpc.auth.login.mutate({ email, password })

      if (!data) {
        error = 'Invalid email or password'
        return
      }

      authStore.setAuth(data)
      goto(resolve('/'))
    } catch (err) {
      if (err instanceof TRPCClientError) {
        error = 'Invalid email or password'
      } else {
        error = 'An error occurred. Please try again.'
      }
      console.error('Login error:', err)
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>{m.sign_in()} - Albumz</title>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
  <div class="w-full space-y-8">
    <div>
      <h1 class="text-7xl font-bold capitalize">{m.sign_in_to_your_account()}</h1>
    </div>

    <form onsubmit={handleSubmit} class="mt-8 space-y-6">
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{error}</p>
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 uppercase">
            {m.email()}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="mt-1 block w-full rounded-md border border-gray-500 bg-transparent px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 uppercase">
            {m.password()}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={password}
            class="mt-1 block w-full rounded-md border border-gray-500 bg-transparent px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <Button.Root
          type="submit"
          disabled={loading}
          class="flex w-full capitalize"
          variant="outline"
          size="lg"
        >
          {loading ? m.signing_in() : m.sign_in()}
        </Button.Root>
      </div>
    </form>
  </div>
</div>
