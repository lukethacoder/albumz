<script lang="ts">
  import { Album } from '$lib/components/album/index.js'
  import { Button, Input, InputCombobox, InputSelect, Tooltip } from '$lib/components'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { m } from '$lib/paraglide/messages'
  import { albumsStore } from '$lib/stores/albums.svelte'
  import { Check, Trash2, X, LayoutGrid, List, Shuffle, Disc, ExternalLink } from '@lucide/svelte'
  import { Dialog } from 'bits-ui'
  import { resolve } from '$app/paths'
  import { siApplemusic, siLastdotfm, siMusicbrainz, siSpotify, siYoutube } from 'simple-icons'

  // albums from server load
  let { data } = $props()

  // Local state for form inputs
  let searchQuery = $state('')
  let minYear = $state<string>('')
  let maxYear = $state<string>('')
  let completionFilter = $state<string>('backlog')
  let sortOption = $state<string>('dateAddedDesc')
  let selectedGenres = $state<string[]>([])

  // Sort options
  const sortOptions = $derived([
    { value: 'dateAddedDesc', label: m.date_added_newest() },
    { value: 'dateAddedAsc', label: m.date_added_oldest() },
    { value: 'releaseDateDesc', label: m.release_date_newest() },
    { value: 'releaseDateAsc', label: m.release_date_oldest() },
  ])

  // Generate year options from available years (unfiltered)
  const yearOptions = $derived([
    { value: '', label: m.any() },
    ...data.availableYears.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
  ])

  const genreOptions = $derived(data.availableGenres.map((g) => ({ value: g, label: g })))

  // Sync URL params to local state (handles initial load and browser back/forward)
  $effect(() => {
    searchQuery = $page.url.searchParams.get('search') || ''
    minYear = $page.url.searchParams.get('minYear') || ''
    maxYear = $page.url.searchParams.get('maxYear') || ''
    completionFilter = $page.url.searchParams.get('completionFilter') || 'backlog'
    sortOption = $page.url.searchParams.get('sortBy') || 'dateAddedDesc'
    selectedGenres = ($page.url.searchParams.get('genres') || '').split(',').filter(Boolean)
  })

  // Debounced search - update URL when searchQuery changes
  let searchTimeout: ReturnType<typeof setTimeout>
  $effect(() => {
    void searchQuery

    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      updateUrl()
    }, 300)
  })

  // Immediate update for other filters
  $effect(() => {
    void minYear
    void maxYear
    void completionFilter
    void sortOption
    void selectedGenres

    updateUrl()
  })

  function updateUrl() {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    if (minYear) params.set('minYear', minYear)
    if (maxYear) params.set('maxYear', maxYear)
    if (completionFilter !== 'backlog') params.set('completionFilter', completionFilter)
    if (sortOption !== 'dateAddedDesc') params.set('sortBy', sortOption)
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','))

    const newUrl = `?${params.toString()}`
    const currentUrl = `?${$page.url.searchParams.toString()}`

    if (newUrl !== currentUrl) {
      goto(newUrl, { keepFocus: true, noScroll: true, replaceState: true })
    }
  }

  const resultCount = $derived(data.albums.length)

  // Bulk selection
  let selectionMode = $state(false)
  let selectedIds = $state(new Set<string>())

  function toggleSelectionMode() {
    selectionMode = !selectionMode
    if (!selectionMode) selectedIds = new Set()
  }
  const selectedAlbums = $derived(data.albums.filter((a) => selectedIds.has(a.id)))
  const allSelectedComplete = $derived(
    selectedAlbums.length > 0 && selectedAlbums.every((a) => !!a.dateCompleted),
  )

  let lastClickedId = $state<string | null>(null)
  let lastClickedAction = $state<'select' | 'deselect'>('select')

  // When filters change, prune selected/anchor IDs that are no longer visible.
  // Intentionally not re-selecting if the album reappears later.
  $effect(() => {
    const visibleIds = new Set(data.albums.map((a) => a.id))
    const pruned = new Set([...selectedIds].filter((id) => visibleIds.has(id)))
    if (pruned.size !== selectedIds.size) selectedIds = pruned
    if (lastClickedId && !visibleIds.has(lastClickedId)) lastClickedId = null
  })

  function toggleSelect(albumId: string, shiftKey: boolean) {
    const next = new Set(selectedIds)
    const ids = data.albums.map((a) => a.id)

    if (shiftKey && lastClickedId) {
      const from = ids.indexOf(lastClickedId)
      const to = ids.indexOf(albumId)
      const [start, end] = from < to ? [from, to] : [to, from]
      const range = ids.slice(start, end + 1)
      if (lastClickedAction === 'select') range.forEach((id) => next.add(id))
      else range.forEach((id) => next.delete(id))
    } else {
      if (next.has(albumId)) {
        next.delete(albumId)
        lastClickedAction = 'deselect'
      } else {
        next.add(albumId)
        lastClickedAction = 'select'
      }
      lastClickedId = albumId
    }

    selectedIds = next
  }

  function selectAll() {
    selectedIds = new Set(data.albums.map((a) => a.id))
  }

  function deselectAll() {
    selectedIds = new Set()
  }

  let viewMode = $state<'grid' | 'table'>(data.viewMode)

  function setViewMode(mode: 'grid' | 'table') {
    viewMode = mode
    fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewMode: mode }),
    })
  }

  let bulkLoading = $state(false)

  async function bulkDelete() {
    const count = selectedIds.size
    const confirmed = confirm(
      `Delete ${count} album${count === 1 ? '' : 's'}? This cannot be undone.`,
    )
    if (!confirmed) return
    bulkLoading = true
    try {
      await Promise.all([...selectedIds].map((id) => albumsStore.delete(id)))
      deselectAll()
    } finally {
      bulkLoading = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (selectionMode && selectedIds.size > 0 && e.key === 'Delete') {
      void bulkDelete()
    }
  }

  async function bulkToggleComplete() {
    const markComplete = !allSelectedComplete
    bulkLoading = true
    try {
      await Promise.all([...selectedIds].map((id) => albumsStore.markComplete(id, markComplete)))
      deselectAll()
    } finally {
      bulkLoading = false
    }
  }

  // Random album picker
  let randomModalOpen = $state(false)
  let randomAlbum = $state<(typeof data.albums)[0] | null>(null)

  function pickRandom() {
    if (!data.albums.length) return
    randomAlbum = data.albums[Math.floor(Math.random() * data.albums.length)]
    randomModalOpen = true
  }

  function reroll() {
    if (data.albums.length <= 1) return
    let next: (typeof data.albums)[0]
    do {
      next = data.albums[Math.floor(Math.random() * data.albums.length)]
    } while (next.id === randomAlbum?.id)
    randomAlbum = next
  }

  const randomLinks = $derived(
    randomAlbum
      ? [
          randomAlbum.urlLastFm
            ? { icon: siLastdotfm, label: 'Last.fm', url: randomAlbum.urlLastFm }
            : null,
          randomAlbum.urlSpotify
            ? { icon: siSpotify, label: 'Spotify', url: randomAlbum.urlSpotify }
            : null,
          randomAlbum.urlAppleMusic
            ? { icon: siApplemusic, label: 'Apple Music', url: randomAlbum.urlAppleMusic }
            : null,
          randomAlbum.urlYoutubeMusic || randomAlbum.urlYoutube
            ? {
                icon: siYoutube,
                label: 'YouTube',
                url: (randomAlbum.urlYoutubeMusic || randomAlbum.urlYoutube)!,
              }
            : null,
          randomAlbum.mbid
            ? {
                icon: siMusicbrainz,
                label: 'MusicBrainz',
                url: `https://musicbrainz.org/release/${randomAlbum.mbid}`,
              }
            : null,
          randomAlbum.urlRateYourMusic
            ? {
                iconUrl:
                  'https://upload.wikimedia.org/wikipedia/commons/d/d0/Rate_Your_Music_logo.svg',
                label: 'Rate Your Music',
                url: randomAlbum.urlRateYourMusic,
              }
            : null,
          randomAlbum.urlNavidrome
            ? {
                iconUrl: 'https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/navidrome.svg',
                label: 'Navidrome',
                url: randomAlbum.urlNavidrome,
              }
            : null,
        ].filter((l): l is NonNullable<typeof l> => l !== null)
      : [],
  )
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head>
  <title>Home - Albumz</title>
</svelte:head>

<div class="w-full">
  <!-- Search and Filter Section -->
  <div class="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
    <div class="mx-auto max-w-7xl space-y-4">
      <div class="flex w-full gap-4">
        <!-- Search -->
        <div class="w-full max-w-2xl">
          <Input.Root
            label={m.search_albums()}
            type="text"
            placeholder={m.search_placeholder()}
            bind:value={searchQuery}
          />
        </div>

        <!-- Genre Filter -->
        {#if data.availableGenres.length > 0}
          <div class="w-full">
            <InputCombobox.Root
              id="genre-filter"
              type="multiple-chip"
              label={m.genre()}
              placeholder={m.all()}
              items={genreOptions}
              bind:value={selectedGenres}
            />
          </div>
        {/if}
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap items-end gap-4">
        <!-- Release Year Range -->
        <div class="flex items-end gap-2">
          <div class="w-32">
            <InputSelect.Root
              type="single"
              label={m.min_year()}
              items={yearOptions}
              bind:value={minYear}
            />
          </div>
          <span class="mb-2 text-zinc-400">—</span>
          <div class="w-32">
            <InputSelect.Root
              type="single"
              label={m.max_year()}
              items={yearOptions}
              bind:value={maxYear}
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div class="w-36">
          <InputSelect.Root
            type="single"
            label={m.status()}
            items={[
              { value: 'all', label: m.all() },
              { value: 'backlog', label: m.backlog() },
              { value: 'listened', label: m.listened() },
            ]}
            bind:value={completionFilter}
          />
        </div>

        <!-- Sort Dropdown -->
        <div class="ml-auto w-64">
          <InputSelect.Root
            type="single"
            items={sortOptions}
            bind:value={sortOption}
            label={m.sort_by()}
          />
        </div>
      </div>

      <!-- Results Count -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button.Root
            variant="ghost"
            theme="neutral"
            onclick={pickRandom}
            disabled={data.albums.length === 0}
          >
            {#snippet iconLeft()}
              <Shuffle class="h-4 w-4" />
            {/snippet}
            {m.random_album()}
          </Button.Root>
          <span class="text-sm text-zinc-600 dark:text-zinc-400">
            {m.showing_albums({ count: resultCount })}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <Button.Root
            variant="ghost"
            theme={selectionMode ? 'brand' : 'neutral'}
            onclick={toggleSelectionMode}
          >
            {selectionMode ? 'Cancel selection' : 'Select mode'}
          </Button.Root>
          <div class="flex items-center gap-0.5">
            <Tooltip.Root>
              {#snippet trigger()}
                <button
                  onclick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  class="cursor-pointer rounded p-1 transition
                    {viewMode === 'grid' ? 'text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}"
                >
                  <LayoutGrid class="h-4 w-4" />
                </button>
              {/snippet}
              {#snippet children()}Grid view{/snippet}
            </Tooltip.Root>
            <Tooltip.Root>
              {#snippet trigger()}
                <button
                  onclick={() => setViewMode('table')}
                  aria-label="List view"
                  class="cursor-pointer rounded p-1 transition
                    {viewMode === 'table' ? 'text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}"
                >
                  <List class="h-4 w-4" />
                </button>
              {/snippet}
              {#snippet children()}List view{/snippet}
            </Tooltip.Root>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Albums -->
  <section class="w-full">
    {#if data.albums.length === 0}
      <div class="flex min-h-[400px] items-center justify-center">
        <div class="text-center">
          <p class="text-lg font-medium text-zinc-900 dark:text-zinc-100">{m.no_albums_found()}</p>
          <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {m.try_adjusting_filters()}
          </p>
        </div>
      </div>
    {:else if viewMode === 'grid'}
      <ul
        class="mx-auto grid w-full grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-2 p-2"
      >
        {#each data.albums as album (album.id)}
          <li class="flex h-full w-full">
            <Album.Root
              albumId={album.id}
              title={album.title}
              artist={album.artist}
              releaseDate={album.releaseDate}
              coverUrl={album.coverUrl}
              dateCompleted={album.dateCompleted}
              selected={selectedIds.has(album.id)}
              onToggleSelect={selectionMode ? toggleSelect : undefined}
            />
          </li>
        {/each}
      </ul>
    {:else}
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-zinc-800">
            <th class="w-14"></th>
            <th
              class="py-2 pr-4 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >Album</th
            >
            <th
              class="py-2 pr-4 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >Artist</th
            >
            <th
              class="py-2 pr-4 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >Year</th
            >
            <th
              class="py-2 pr-4 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >Genre</th
            >
            <th
              class="py-2 pr-4 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >Rating</th
            >
            <th
              class="py-2 pr-4 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase"
              >Date Added</th
            >
            <th class="w-20"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.albums as album (album.id)}
            <Album.TableRow
              albumId={album.id}
              title={album.title}
              artist={album.artist}
              releaseDate={album.releaseDate}
              coverUrl={album.coverUrl}
              dateCompleted={album.dateCompleted}
              genre={album.genre}
              createdAt={album.createdAt}
              rating={album.rating}
              selected={selectedIds.has(album.id)}
              onToggleSelect={selectionMode ? toggleSelect : undefined}
            />
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</div>

<!-- Bulk action bar -->
{#if selectedIds.size > 0}
  <div
    class="fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 shadow-2xl ring-1 ring-white/10"
  >
    <span class="min-w-0 flex-1 text-sm font-medium text-zinc-200">
      {selectedIds.size} selected
    </span>
    <button
      onclick={selectedIds.size === data.albums.length ? deselectAll : selectAll}
      class="shrink-0 text-xs text-zinc-400 transition hover:text-zinc-200"
      disabled={bulkLoading}
    >
      {selectedIds.size === data.albums.length ? 'Deselect all' : 'Select all'}
    </button>
    <button
      onclick={bulkToggleComplete}
      disabled={bulkLoading}
      aria-label={allSelectedComplete ? 'Mark incomplete' : 'Mark complete'}
      class="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50
        {allSelectedComplete
        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}"
    >
      <Check class="h-3.5 w-3.5" />
      {allSelectedComplete ? 'Mark incomplete' : 'Mark complete'}
    </button>
    <button
      onclick={bulkDelete}
      disabled={bulkLoading}
      class="flex shrink-0 items-center gap-1.5 rounded-md bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
    >
      <Trash2 class="h-3.5 w-3.5" />
      Delete
    </button>
    <button
      onclick={deselectAll}
      disabled={bulkLoading}
      aria-label="Clear selection"
      class="shrink-0 text-zinc-500 transition hover:text-zinc-300 disabled:opacity-50"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
{/if}

<!-- Random album modal -->
<Dialog.Root bind:open={randomModalOpen}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-zinc-950 p-6 shadow-2xl ring-1 ring-white/10 focus:outline-none"
    >
      <Dialog.Description class="sr-only">Random album suggestion</Dialog.Description>
      {#if randomAlbum}
        <div class="flex gap-4">
          <!-- Cover -->
          <div class="shrink-0">
            {#if randomAlbum.coverUrl}
              <img
                src={randomAlbum.coverUrl}
                alt="Album artwork"
                class="h-24 w-24 rounded-lg object-cover"
              />
            {:else}
              <span class="flex h-24 w-24 items-center justify-center rounded-lg bg-zinc-900">
                <Disc class="h-10 w-10 text-emerald-600" />
              </span>
            {/if}
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <Dialog.Title class="truncate text-lg font-bold text-neutral-100">
              {randomAlbum.title}
            </Dialog.Title>
            <p class="mt-0.5 truncate text-sm text-neutral-400">{randomAlbum.artist}</p>
            {#if randomAlbum.releaseDate}
              <p class="mt-0.5 text-xs text-neutral-600">{randomAlbum.releaseDate.slice(0, 4)}</p>
            {/if}
            {#if randomAlbum.genre}
              <p class="mt-1 text-xs text-neutral-600">
                {randomAlbum.genre
                  .split(';')
                  .map((g) => g.trim())
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            {/if}
          </div>
        </div>

        <!-- External links -->
        {#if randomLinks.length > 0}
          <ul class="mt-4 flex gap-3">
            {#each randomLinks as link (link.url)}
              <li>
                <a
                  href={link.url}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex h-7 w-7 fill-neutral-500 p-1 opacity-50 transition hover:opacity-100 {link.iconUrl
                    ? 'grayscale'
                    : ''}"
                >
                  {#if 'icon' in link}
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <title>{link.label}</title>
                      <path d={link.icon.path} />
                    </svg>
                  {:else}
                    <img src={link.iconUrl} alt={link.label} />
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        {/if}

        <!-- Actions -->
        <div class="mt-5 flex items-center gap-2">
          <a
            href={resolve(`/albums/${randomAlbum.id}`)}
            onclick={() => (randomModalOpen = false)}
            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            <ExternalLink class="h-3.5 w-3.5" />
            {m.view_album()}
          </a>
          <button
            onclick={reroll}
            disabled={data.albums.length <= 1}
            class="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-40"
          >
            <Shuffle class="h-3.5 w-3.5" />
            {m.try_another()}
          </button>
          <Dialog.Close
            class="rounded-lg p-2 text-zinc-500 transition hover:text-zinc-200"
            aria-label="Close"
          >
            <X class="h-4 w-4" />
          </Dialog.Close>
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
