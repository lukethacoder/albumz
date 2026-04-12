<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { trpc } from '$lib/trpc/client'
  import { Button, Input } from '$lib/components'
  import { TRPCClientError } from '@trpc/client'
  import { importStore } from '$lib/stores/import.svelte'
  import { m } from '$lib/paraglide/messages'
  import { translateError } from '$lib/utils'

  type Mode = 'url' | 'manual'

  let { data } = $props()

  const isAvailable = (key: string) => (data.availableServices as string[]).includes(key)
  const isEnabled = (key: string) =>
    data.enabledServices.length === 0 || data.enabledServices.includes(key)

  // A service is usable only if it's both available (credentials configured) and enabled by user
  const spotifyEnabled = $derived(isAvailable('spotify') && isEnabled('spotify'))
  const appleMusicEnabled = $derived(isAvailable('applemusic') && isEnabled('applemusic'))
  const youtubeEnabled = $derived(isAvailable('youtube') && isEnabled('youtube'))
  const urlImportEnabled = $derived(spotifyEnabled || appleMusicEnabled || youtubeEnabled)

  const urlLabel = $derived(
    [
      spotifyEnabled && 'Spotify',
      appleMusicEnabled && 'Apple Music',
      youtubeEnabled && 'YouTube',
    ]
      .filter(Boolean)
      .join(' or ') + ' URL',
  )
  const urlPlaceholder = $derived(
    [
      spotifyEnabled && 'https://open.spotify.com/album/...',
      appleMusicEnabled && 'https://music.apple.com/...',
      youtubeEnabled && 'https://youtu.be/...',
    ]
      .filter(Boolean)
      .join(' or '),
  )

  let mode = $state<Mode>(urlImportEnabled ? 'url' : 'manual')
  let loading = $state(false)
  let error = $state<string | null>(null)

  // URL mode
  let sourceUrl = $state('')

  // Manual mode
  let title = $state('')
  let artist = $state('')
  let releaseDate = $state('')
  let coverUrl = $state('')

  function switchMode(next: Mode) {
    mode = next
    error = null
  }

  async function handleUrlSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = null

    try {
      const { jobId } = await trpc.albums.createFromUrl.mutate({ url: sourceUrl })
      importStore.start(jobId)
      goto(resolve('/'))
    } catch (err) {
      if (err instanceof TRPCClientError) {
        error = translateError(err.message)
      } else {
        error = m.an_error_occurred()
      }
      loading = false
    }
  }

  async function handleManualSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = null

    try {
      await trpc.albums.create.mutate({
        title,
        artist,
        releaseDate: releaseDate || undefined,
        coverUrl: coverUrl || undefined,
      })
      goto(resolve('/'))
    } catch (err) {
      if (err instanceof TRPCClientError) {
        error = translateError(err.message)
      } else {
        error = m.an_error_occurred()
      }
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Add Album - Albumz</title>
</svelte:head>

<section
  class="relative flex h-full w-full items-center justify-center px-8 py-12 lg:py-16 xl:py-20"
>
  <div class="w-full max-w-lg space-y-6">
    <h1 class="font-funnel text-4xl font-bold capitalize">{m.add_album()}</h1>

    <!-- Mode toggle — only shown when URL import is available -->
    {#if urlImportEnabled}
      <div
        class="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <button
          type="button"
          onclick={() => switchMode('url')}
          class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors {mode ===
          'url'
            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}"
        >
          {m.from_url()}
        </button>
        <button
          type="button"
          onclick={() => switchMode('manual')}
          class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors {mode ===
          'manual'
            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}"
        >
          {m.manual_entry()}
        </button>
      </div>
    {/if}

    {#if error}
      <div class="rounded-md bg-red-50 p-4 dark:bg-red-950/30">
        <p class="text-sm text-red-800 dark:text-red-400">{error}</p>
      </div>
    {/if}

    {#if mode === 'url'}
      <form onsubmit={handleUrlSubmit} class="space-y-4">
        <Input.Root
          label={urlLabel}
          type="url"
          placeholder={urlPlaceholder}
          bind:value={sourceUrl}
          required
        />
        <Button.Root type="submit" {loading} disabled={loading} size="lg" class="w-full">
          {loading ? m.importing() : m.import_album()}
        </Button.Root>
      </form>
    {:else}
      <form onsubmit={handleManualSubmit} class="space-y-4">
        <Input.Root
          label={m.album_title()}
          type="text"
          placeholder="e.g. Paranoid"
          bind:value={title}
          required
        />
        <Input.Root
          label={m.artist()}
          type="text"
          placeholder="e.g. Black Sabbath"
          bind:value={artist}
          required
        />
        <Input.Root label={m.release_date()} type="date" bind:value={releaseDate} />
        <Input.Root
          label={m.album_artwork_url()}
          type="url"
          placeholder="https://..."
          bind:value={coverUrl}
        />
        <Button.Root type="submit" {loading} disabled={loading} size="lg" class="w-full">
          {loading ? m.adding() : m.add_album()}
        </Button.Root>
      </form>
    {/if}
  </div>
</section>
