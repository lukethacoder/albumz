<script lang="ts">
  import { importStore } from '$lib/stores/import.svelte'

  const STEP_PROGRESS: Record<string, number> = {
    pending: 5,
    parsing: 20,
    fetching_metadata: 40,
    fetching_artwork: 60,
    saving: 78,
    fetching_links: 92,
    complete: 100,
  }

  const STEP_LABELS: Record<string, string> = {
    pending: 'Queued...',
    parsing: 'Parsing URL...',
    fetching_metadata: 'Fetching metadata...',
    fetching_artwork: 'Looking up artwork...',
    saving: 'Saving to library...',
    fetching_links: 'Fetching external links...',
    complete: 'Album added!',
  }

  const isPlaylist = $derived(importStore.totalAlbums !== null)

  const progress = $derived(() => {
    if (importStore.status === 'complete') return 100
    if (importStore.status === 'error') return 100
    if (isPlaylist) {
      const total = importStore.totalAlbums ?? 1
      const done = importStore.processedAlbums ?? 0
      if (importStore.step === 'fetching_metadata') return 5
      if (importStore.step === 'complete') return 100
      return Math.round(10 + (done / total) * 90)
    }
    return STEP_PROGRESS[importStore.step ?? 'pending'] ?? 5
  })

  const label = $derived(() => {
    if (importStore.status === 'error') return importStore.error ?? 'Import failed'
    if (isPlaylist) {
      const total = importStore.totalAlbums ?? 0
      const done = importStore.processedAlbums ?? 0
      if (importStore.step === 'fetching_metadata') return 'Fetching playlist...'
      if (importStore.step === 'complete') return `${total} ${total === 1 ? 'album' : 'albums'} added!`
      return `Adding albums... ${done} / ${total}`
    }
    return STEP_LABELS[importStore.step ?? 'pending'] ?? 'Working...'
  })

  const isError = $derived(importStore.status === 'error')
  const isComplete = $derived(importStore.status === 'complete')
</script>

{#if importStore.jobId}
  <div
    role="status"
    aria-live="polite"
    class="fixed right-6 bottom-6 z-50 w-72 overflow-hidden rounded-lg border bg-white shadow-lg
      {isError
      ? 'border-red-200 dark:border-red-800/50'
      : isComplete
        ? 'border-emerald-200 dark:border-emerald-800/50'
        : 'border-zinc-200 dark:border-zinc-700'}
      dark:bg-zinc-900"
  >
    <!-- Header -->
    <div class="flex items-center gap-2.5 px-3 py-2.5">
      <!-- Icon -->
      <div class="shrink-0">
        {#if isComplete}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4 text-emerald-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        {:else if isError}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4 animate-spin text-emerald-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        {/if}
      </div>

      <!-- Label -->
      <span
        class="flex-1 truncate text-xs font-medium
          {isError
          ? 'text-red-700 dark:text-red-400'
          : isComplete
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-zinc-700 dark:text-zinc-300'}"
      >
        {label()}
      </span>

      <!-- Dismiss button -->
      <button
        type="button"
        onclick={() => importStore.dismiss()}
        class="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Dismiss"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Progress bar -->
    <div class="h-0.5 w-full bg-zinc-100 dark:bg-zinc-800">
      <div
        class="h-full transition-all duration-500 ease-out
          {isError ? 'bg-red-500' : 'bg-emerald-500'}"
        style="width: {progress()}%"
      ></div>
    </div>
  </div>
{/if}
