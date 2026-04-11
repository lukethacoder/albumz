<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { trpc } from '$lib/trpc/client'

  const ALL_SERVICES = [
    { key: 'lastfm', label: 'Last.fm' },
    { key: 'spotify', label: 'Spotify' },
    { key: 'applemusic', label: 'Apple Music' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'musicbrainz', label: 'MusicBrainz' },
    { key: 'rateyourmusic', label: 'Rate Your Music' },
    { key: 'navidrome', label: 'Navidrome' },
  ] as const

  let { data } = $props()
  const user = $derived(data.user)

  // Only show services that have their server-side credentials configured
  const availableServices = $derived(
    ALL_SERVICES.filter((s) => data.availableServices.includes(s.key)),
  )

  let navUrl = $state(data.navidromeConfig?.url ?? '')
  let navUsername = $state(data.navidromeConfig?.username ?? '')
  let navPassword = $state('')

  let navSaving = $state(false)
  let navTesting = $state(false)
  let navDeleting = $state(false)
  let navMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null)

  const hasExistingConfig = $derived(!!data.navidromeConfig)

  // Empty array from server means all enabled — show all available checked by default
  let selectedServices = $state<string[]>(
    data.enabledServices.length > 0
      ? data.enabledServices.filter((s) => data.availableServices.includes(s))
      : availableServices.map((s) => s.key),
  )
  let servicesSaving = $state(false)
  let servicesMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null)

  function toggleService(key: string) {
    if (selectedServices.includes(key)) {
      selectedServices = selectedServices.filter((s) => s !== key)
    } else {
      selectedServices = [...selectedServices, key]
    }
  }

  async function saveServices() {
    servicesSaving = true
    servicesMessage = null
    try {
      // If all available services are selected, save empty array (= all enabled, the default)
      const toSave = selectedServices.length === availableServices.length ? [] : selectedServices
      await trpc.navidrome.saveEnabledServices.mutate({ services: toSave })
      servicesMessage = { type: 'success', text: 'Preferences saved.' }
      await invalidateAll()
    } catch {
      servicesMessage = { type: 'error', text: 'Failed to save preferences.' }
    } finally {
      servicesSaving = false
    }
  }

  async function saveNavidrome() {
    if (!navUrl || !navUsername || !navPassword) return
    navSaving = true
    navMessage = null
    try {
      await trpc.navidrome.saveConfig.mutate({
        url: navUrl,
        username: navUsername,
        password: navPassword,
      })
      navPassword = ''
      navMessage = { type: 'success', text: 'Navidrome config saved.' }
      await invalidateAll()
    } catch {
      navMessage = { type: 'error', text: 'Failed to save config.' }
    } finally {
      navSaving = false
    }
  }

  async function testNavidrome() {
    if (!navUrl || !navUsername || !navPassword) return
    navTesting = true
    navMessage = null
    try {
      const result = await trpc.navidrome.testConfig.mutate({
        url: navUrl,
        username: navUsername,
        password: navPassword,
      })
      navMessage = result.ok
        ? { type: 'success', text: 'Connection successful.' }
        : { type: 'error', text: 'Connection failed — check your credentials.' }
    } catch {
      navMessage = { type: 'error', text: 'Connection failed.' }
    } finally {
      navTesting = false
    }
  }

  async function deleteNavidrome() {
    navDeleting = true
    navMessage = null
    try {
      await trpc.navidrome.deleteConfig.mutate()
      navUrl = ''
      navUsername = ''
      navPassword = ''
      navMessage = { type: 'success', text: 'Navidrome config removed.' }
      await invalidateAll()
    } catch {
      navMessage = { type: 'error', text: 'Failed to delete config.' }
    } finally {
      navDeleting = false
    }
  }
</script>

<svelte:head>
  <title>Profile - Albumz</title>
</svelte:head>

{#if user}
  <div class="mx-auto max-w-4xl space-y-10 p-6">
    <div>
      <h1 class="mb-6 text-3xl font-bold">Profile</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium">User ID</label>
          <p class="mt-1 text-sm">{user.id}</p>
        </div>

        <div>
          <label class="block text-sm font-medium">Email</label>
          <p class="mt-1 text-sm">{user.email}</p>
        </div>

        {#if user.username}
          <div>
            <label class="block text-sm font-medium">Username</label>
            <p class="mt-1 text-sm">{user.username}</p>
          </div>
        {/if}
      </div>
    </div>

    <div>
      <h2 class="mb-4 text-xl font-semibold">Navidrome</h2>

      <div class="max-w-md space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium" for="nav-url">Server URL</label>
          <input
            id="nav-url"
            type="url"
            bind:value={navUrl}
            placeholder="https://navidrome.example.com"
            class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium" for="nav-username">Username</label>
          <input
            id="nav-username"
            type="text"
            bind:value={navUsername}
            placeholder="admin"
            class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium" for="nav-password">
            Password{hasExistingConfig ? ' (leave blank to keep existing)' : ''}
          </label>
          <input
            id="nav-password"
            type="password"
            bind:value={navPassword}
            placeholder={hasExistingConfig ? '••••••••' : 'password'}
            class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>

        {#if navMessage}
          <p class="text-sm {navMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}">
            {navMessage.text}
          </p>
        {/if}

        <div class="flex gap-2">
          <button
            onclick={testNavidrome}
            disabled={navTesting || !navUrl || !navUsername || !navPassword}
            class="rounded border border-neutral-600 px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-40"
          >
            {navTesting ? 'Testing...' : 'Test connection'}
          </button>

          <button
            onclick={saveNavidrome}
            disabled={navSaving || !navUrl || !navUsername || !navPassword}
            class="rounded bg-white px-3 py-2 text-sm text-black hover:bg-neutral-200 disabled:opacity-40"
          >
            {navSaving ? 'Saving...' : 'Save'}
          </button>

          {#if hasExistingConfig}
            <button
              onclick={deleteNavidrome}
              disabled={navDeleting}
              class="rounded border border-red-800 px-3 py-2 text-sm text-red-400 hover:bg-red-950 disabled:opacity-40"
            >
              {navDeleting ? 'Removing...' : 'Remove'}
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div>
      <h2 class="mb-1 text-xl font-semibold">External Services</h2>
      <p class="mb-4 text-sm text-neutral-400">Choose which services appear on album pages.</p>

      <div class="max-w-md space-y-4">
        <div class="flex flex-wrap gap-2">
          {#each availableServices as service (service.key)}
            <button
              type="button"
              onclick={() => toggleService(service.key)}
              class="inline-flex cursor-pointer justify-center overflow-hidden rounded-md font-geist transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 px-3 py-1 text-sm {selectedServices.includes(service.key)
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400'
                : 'bg-transparent text-zinc-700 ring-1 ring-inset ring-zinc-900/20 hover:bg-zinc-50 hover:ring-zinc-900/40 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/15 dark:hover:bg-white/10 dark:hover:text-zinc-300 dark:hover:ring-white/30'}"
            >
              {service.label}
            </button>
          {/each}
        </div>

        {#if servicesMessage}
          <p
            class="text-sm {servicesMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}"
          >
            {servicesMessage.text}
          </p>
        {/if}

        <button
          onclick={saveServices}
          disabled={servicesSaving}
          class="rounded bg-white px-3 py-2 text-sm text-black hover:bg-neutral-200 disabled:opacity-40"
        >
          {servicesSaving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  </div>
{/if}
