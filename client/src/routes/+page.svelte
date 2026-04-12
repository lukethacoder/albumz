<script lang="ts">
  import { Album } from '$lib/components/album/index.js'
  import { Input, InputCheckbox, InputCombobox, InputSelect } from '$lib/components'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { m } from '$lib/paraglide/messages'

  // albums from server load
  let { data } = $props()

  // Local state for form inputs
  let searchQuery = $state('')
  let minYear = $state<string>('')
  let maxYear = $state<string>('')
  let showCompleted = $state(false)
  let sortOption = $state<string>('dateAddedDesc')

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

  // Sync URL params to local state (handles initial load and browser back/forward)
  $effect(() => {
    searchQuery = $page.url.searchParams.get('search') || ''
    minYear = $page.url.searchParams.get('minYear') || ''
    maxYear = $page.url.searchParams.get('maxYear') || ''
    showCompleted = $page.url.searchParams.get('showCompleted') === 'true'
    sortOption = $page.url.searchParams.get('sortBy') || 'dateAddedDesc'
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
    void showCompleted
    void sortOption

    updateUrl()
  })

  function updateUrl() {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    if (minYear) params.set('minYear', minYear)
    if (maxYear) params.set('maxYear', maxYear)
    if (showCompleted) params.set('showCompleted', 'true')
    if (sortOption !== 'dateAddedDesc') params.set('sortBy', sortOption)

    const newUrl = `?${params.toString()}`
    const currentUrl = `?${$page.url.searchParams.toString()}`

    if (newUrl !== currentUrl) {
      goto(newUrl, { keepFocus: true, noScroll: true, replaceState: true })
    }
  }

  const resultCount = $derived(data.albums.length)
</script>

<svelte:head>
  <title>Home - Albumz</title>
</svelte:head>

<div class="w-full">
  <!-- Search and Filter Section -->
  <div class="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
    <div class="mx-auto max-w-7xl space-y-4">
      <!-- Search -->
      <div class="w-full max-w-2xl">
        <Input.Root
          label={m.search_albums()}
          type="text"
          placeholder={m.search_placeholder()}
          bind:value={searchQuery}
        />
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

        <!-- Show Completed Checkbox -->
        <div class="mb-2">
          <InputCheckbox.Root bind:checked={showCompleted} label={m.show_completed_albums()} />
        </div>

        <!-- Sort Dropdown -->
        <div class="ml-auto w-64">
          <InputSelect.Root type="single" items={sortOptions} bind:value={sortOption} label={m.sort_by()} />
        </div>
      </div>

      <!-- Results Count -->
      <div class="text-sm text-zinc-600 dark:text-zinc-400">
        {m.showing_albums({ count: resultCount })}
      </div>
    </div>
  </div>

  <!-- Albums Grid -->
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
    {:else}
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
            />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
