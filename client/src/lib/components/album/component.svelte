<script lang="ts">
  import { resolve } from '$app/paths'
  import { Check, Disc, Trash2 } from '@lucide/svelte'
  import { albumsStore } from '$lib/stores/albums.svelte'
  import type { RootProps } from './types'

  let {
    albumId,
    title,
    artist,
    coverUrl,
    releaseDate,
    dateCompleted,
    selected = false,
    onToggleSelect,
    onDeleteAlbum,
  }: RootProps = $props()

  const releaseDateFormatted = $derived(releaseDate ? releaseDate.split('-')[0] : 'Unknown')

  let isComplete = $derived(!!dateCompleted)
  let isLoading = $derived(albumsStore.isLoading(albumId))

  async function handleDelete(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (onDeleteAlbum) {
      await onDeleteAlbum(albumId, title)
    } else {
      await albumsStore.deleteWithConfirm(albumId, title, false)
    }
  }

  async function handleToggleComplete(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await albumsStore.toggleComplete(albumId, isComplete)
  }
</script>

<div
  class="group relative flex w-full flex-col rounded-md hover:bg-neutral-800
    {selected ? 'ring-2 ring-emerald-500' : ''}"
>
  {#if onToggleSelect}
    <!-- Selection mode: full-card button, no navigation -->
    <button
      onclick={(e) => onToggleSelect(albumId, e.shiftKey)}
      aria-label={selected ? 'Deselect album' : 'Select album'}
      class="absolute inset-0 z-10 w-full cursor-pointer rounded-md"
    ></button>
  {:else}
    <a
      href={resolve(`/albums/${albumId}`)}
      aria-label="Select album"
      title={`${artist} - ${title}`}
      class="absolute inset-0 z-10 cursor-pointer rounded-lg focus:outline-2 focus:outline-offset-2 focus:outline-emerald-500"
    ></a>
  {/if}

  <span class="p-2">
    <span class="relative flex aspect-square w-full overflow-hidden rounded-lg">
      <span class="absolute mx-auto flex h-full w-full items-center justify-center bg-neutral-900">
        <Disc class="h-full w-1/2 text-emerald-600" />
      </span>
      {#if coverUrl}
        <img src={coverUrl} alt="album artwork" class="relative w-full max-w-full" />
      {/if}
      {#if onToggleSelect}
        <!-- Visual-only checkbox indicator -->
        <span
          class="pointer-events-none absolute top-2 left-2 z-20 flex h-5 w-5 items-center justify-center rounded-sm border-2 transition
            {selected
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-white/80 bg-black/40'}"
        >
          {#if selected}
            <Check class="h-3 w-3 text-white" />
          {/if}
        </span>
      {/if}
    </span>
    <p class="mt-3 mb-1 line-clamp-2 font-funnel leading-5 font-bold dark:text-neutral-300">
      {title}
    </p>
    <p class="mt-0 line-clamp-1 font-geist text-sm dark:text-neutral-500">
      {releaseDateFormatted} • {artist}
    </p>
    <div class="relative z-20 mt-2 flex gap-1" class:hidden={!!onToggleSelect}>
      <button
        onclick={handleToggleComplete}
        disabled={isLoading}
        class="flex cursor-pointer items-center justify-center rounded-md p-1.5 transition disabled:opacity-40
          {isComplete
          ? 'text-emerald-500 opacity-100 hover:bg-emerald-500/10'
          : 'text-neutral-500 opacity-70 hover:bg-neutral-500/10 hover:opacity-100'}"
        aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
      >
        <Check class="h-4 w-4" />
      </button>
      <button
        onclick={handleDelete}
        disabled={isLoading}
        class="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-red-500 opacity-70 transition hover:bg-red-500/10 hover:opacity-100 disabled:opacity-40"
        aria-label="Delete album"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>
  </span>
</div>
