<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { trpc } from '$lib/trpc/client'
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime'
  import { Button, InputSelect } from '$lib/components'
  import { m } from '$lib/paraglide/messages.js'
  import { Check, X, Download, Upload } from '@lucide/svelte'

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

  // CSV export
  async function handleExport() {
    const csv = await trpc.albums.exportCsv.query()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `albumz-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // CSV import
  let importLoading = $state(false)
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null)
  let fileInput: HTMLInputElement

  async function handleImport() {
    fileInput.click()
  }

  async function handleFileChange(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    importLoading = true
    importMessage = null
    try {
      const csv = await file.text()
      const result = await trpc.albums.importCsv.mutate({ csv })
      importMessage = { type: 'success', text: m.csv_import_success({ created: result.created, skipped: result.skipped }) }
      await invalidateAll()
    } catch {
      importMessage = { type: 'error', text: m.csv_import_error() }
    } finally {
      importLoading = false
      fileInput.value = ''
    }
  }

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
      ? data.enabledServices.filter((s) => (data.availableServices as string[]).includes(s))
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
      servicesMessage = { type: 'success', text: m.preferences_saved() }
      await invalidateAll()
    } catch {
      servicesMessage = { type: 'error', text: m.failed_to_save_preferences() }
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
      navMessage = { type: 'success', text: m.navidrome_config_saved() }
      await invalidateAll()
    } catch {
      navMessage = { type: 'error', text: m.failed_to_save_config() }
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
        ? { type: 'success', text: m.connection_successful() }
        : { type: 'error', text: m.connection_failed_check_credentials() }
    } catch {
      navMessage = { type: 'error', text: m.connection_failed() }
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
      navMessage = { type: 'success', text: m.navidrome_config_removed() }
      await invalidateAll()
    } catch {
      navMessage = { type: 'error', text: m.failed_to_delete_config() }
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
      <h1 class="mb-6 text-3xl font-bold capitalize">{m.profile()}</h1>

      <div class="space-y-4">
        <div>
          <p class="block text-sm font-medium capitalize">{m.user_id()}</p>
          <p class="mt-1 text-sm">{user.id}</p>
        </div>

        <div>
          <p class="block text-sm font-medium capitalize">{m.email()}</p>
          <p class="mt-1 text-sm">{user.email}</p>
        </div>

        {#if user.username}
          <div>
            <p class="block text-sm font-medium capitalize">{m.username()}</p>
            <p class="mt-1 text-sm">{user.username}</p>
          </div>
        {/if}
      </div>
    </div>

    <div>
      <h2 class="mb-4 text-xl font-semibold">{m.language()}</h2>
      <InputSelect.Root
        type="single"
        triggerProps={{ class: 'w-24' }}
        value={getLocale()}
        items={locales.map((l) => ({ value: l, label: l }))}
        onValueChange={(v: string | undefined) => {
          setLocale((v ?? 'en') as (typeof locales)[number])
        }}
      />
    </div>

    <div>
      <h2 class="mb-4 text-xl font-semibold">Navidrome</h2>

      <div class="max-w-md space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium" for="nav-url">{m.server_url()}</label>
          <input
            id="nav-url"
            type="url"
            bind:value={navUrl}
            placeholder="https://navidrome.example.com"
            class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium" for="nav-username">{m.username()}</label>
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
            {m.password()}{hasExistingConfig ? ` (${m.leave_blank_to_keep_existing()})` : ''}
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
          <p class="text-sm {navMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}">
            {navMessage.text}
          </p>
        {/if}

        <div class="flex gap-2">
          <Button.Root
            variant="outline"
            theme="neutral"
            onclick={testNavidrome}
            disabled={navTesting || !navUrl || !navUsername || !navPassword}
          >
            {navTesting ? m.testing() : m.test_connection()}
          </Button.Root>

          <Button.Root
            variant="outline"
            onclick={saveNavidrome}
            disabled={navSaving || !navUrl || !navUsername || !navPassword}
          >
            {navSaving ? m.saving() : m.save()}
          </Button.Root>

          {#if hasExistingConfig}
            <Button.Root
              theme="negative"
              variant="outline"
              onclick={deleteNavidrome}
              disabled={navDeleting}
            >
              {navDeleting ? m.removing() : m.remove()}
            </Button.Root>
          {/if}
        </div>
      </div>
    </div>

    <div>
      <h2 class="mb-4 text-xl font-semibold">{m.data()}</h2>

      <input
        bind:this={fileInput}
        type="file"
        accept=".csv,text/csv"
        class="hidden"
        onchange={handleFileChange}
      />

      <div class="flex items-center gap-3">
        <Button.Root variant="outline" theme="neutral" onclick={handleExport}>
          <Download class="h-4 w-4" />
          {m.export_csv()}
        </Button.Root>
        <Button.Root variant="outline" theme="neutral" onclick={handleImport} disabled={importLoading}>
          {#if importLoading}
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          {:else}
            <Upload class="h-4 w-4" />
          {/if}
          {m.import_csv()}
        </Button.Root>
      </div>

      {#if importMessage}
        <p class="mt-3 text-sm {importMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}">
          {importMessage.text}
        </p>
      {/if}
    </div>

    <div>
      <h2 class="mb-1 text-xl font-semibold">{m.external_services()}</h2>
      <p class="mb-4 text-sm text-neutral-400">
        {m.choose_which_services_appear_on_album_pages()}.
      </p>

      <div class="max-w-md space-y-4">
        <div class="flex flex-wrap gap-2">
          {#each availableServices as service (service.key)}
            <button
              type="button"
              onclick={() => toggleService(service.key)}
              class="inline-flex cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-md bg-transparent px-3 py-1 font-geist text-sm text-zinc-700 ring-1 ring-zinc-900/20 transition ring-inset hover:bg-zinc-50 hover:ring-zinc-900/40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97] dark:bg-white/5 dark:text-zinc-400 dark:ring-white/15 dark:hover:bg-white/10 dark:hover:text-zinc-300 dark:hover:ring-white/30 dark:focus-visible:ring-offset-zinc-900"
            >
              {service.label}
              {#if selectedServices.includes(service.key)}
                <Check class="h-4 w-4 text-emerald-400" />
              {:else}
                <X class="h-4 w-4 text-red-400" />
              {/if}
            </button>
          {/each}
        </div>

        {#if servicesMessage}
          <p
            class="text-sm {servicesMessage.type === 'success'
              ? 'text-emerald-400'
              : 'text-red-400'}"
          >
            {servicesMessage.text}
          </p>
        {/if}

        <Button.Root onclick={saveServices} disabled={servicesSaving}>
          {servicesSaving ? m.saving() : m.save_preferences()}
        </Button.Root>
      </div>
    </div>
  </div>
{/if}
