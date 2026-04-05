<script lang="ts">
  import { Album } from '$lib/components/album/index.js'
  import { Input, InputCheckbox, InputCombobox, InputSelect } from '$lib/components'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'

  // albums from server load
  let { data } = $props()

  // Local state for form inputs
  let searchQuery = $state('')
  let minYear = $state<string>('')
  let maxYear = $state<string>('')
  let showCompleted = $state(false)
  let sortOption = $state<string>('dateAddedDesc')

  // Sort options
  const sortOptions = [
    { value: 'dateAddedDesc', label: 'Date Added (Newest)' },
    { value: 'dateAddedAsc', label: 'Date Added (Oldest)' },
    { value: 'releaseDateDesc', label: 'Release Date (Newest)' },
    { value: 'releaseDateAsc', label: 'Release Date (Oldest)' },
  ]

  // Generate year options from available years (unfiltered)
  const yearOptions = $derived([
    { value: '', label: 'Any' },
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
          label="Search albums"
          type="text"
          placeholder="Search by title or artist..."
          bind:value={searchQuery}
        />
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap items-end gap-4">
        <!-- Release Year Range -->
        <div class="flex items-end gap-2">
          <div class="w-32">
            <InputSelect.Root
              label="Min Year"
              items={yearOptions}
              placeholder="Min"
              bind:value={minYear}
            />
          </div>
          <span class="mb-2 text-zinc-400">—</span>
          <div class="w-32">
            <InputSelect.Root
              label="Max Year"
              items={yearOptions}
              placeholder="Max"
              bind:value={maxYear}
            />
          </div>
        </div>

        <!-- Show Completed Checkbox -->
        <div class="mb-2">
          <InputCheckbox.Root bind:checked={showCompleted} label="Show completed albums" />
        </div>

        <!-- Sort Dropdown -->
        <div class="ml-auto w-64">
          <InputSelect.Root items={sortOptions} bind:value={sortOption} label="Sort by" />
        </div>
      </div>

      <!-- Results Count -->
      <div class="text-sm text-zinc-600 dark:text-zinc-400">
        Showing {resultCount}
        {resultCount === 1 ? 'album' : 'albums'}
      </div>
    </div>
  </div>

  <!-- Albums Grid -->
  <section class="w-full">
    {#if data.albums.length === 0}
      <div class="flex min-h-[400px] items-center justify-center">
        <div class="text-center">
          <p class="text-lg font-medium text-zinc-900 dark:text-zinc-100">No albums found</p>
          <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Try adjusting your filters or search query
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
