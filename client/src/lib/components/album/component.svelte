<script lang="ts">
  import { resolve } from '$app/paths'
  import { Disc, Trash2 } from '@lucide/svelte'
  import { albumsStore } from '$lib/stores/albums.svelte'
  import { m } from '$lib/paraglide/messages.js'
  import type { RootProps } from './types'

  let { albumId, title, artist, coverUrl, releaseDate, onDeleteAlbum }: RootProps = $props()

  const releaseDateFormatted = $derived(releaseDate ? releaseDate.split('-')[0] : 'Unknown')

  let isDeleting = $derived(albumsStore.isLoading(albumId))

  async function handleDelete(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (onDeleteAlbum) {
      await onDeleteAlbum(albumId, title)
    } else {
      // Fallback to direct store usage
      await albumsStore.deleteWithConfirm(albumId, title, false)
    }
  }
</script>

<div class="relative flex w-full flex-col rounded-md hover:bg-neutral-800">
  <a
    href={resolve(`/albums/${albumId}`)}
    aria-label="Select album"
    title={`${artist} - ${title}`}
    class="inset absolute z-10 h-full w-full cursor-pointer rounded-lg focus:outline-2 focus:outline-offset-2 focus:outline-emerald-500"
  ></a>
  <span class="p-2">
    <span class="relative flex aspect-square w-full overflow-hidden rounded-lg">
      <span class="absolute mx-auto flex h-full w-full items-center justify-center bg-neutral-900">
        <Disc class="h-full w-1/2 text-emerald-600" />
      </span>
      {#if coverUrl}
        <img src={coverUrl} alt="album artwork" class="relative w-full max-w-full" />
      {/if}
    </span>
    <p class="mt-3 mb-1 line-clamp-2 font-funnel leading-5 font-bold dark:text-neutral-300">
      {title}
    </p>
    <p class="mt-0 line-clamp-1 font-geist text-sm dark:text-neutral-500">
      {releaseDateFormatted} • {artist}
    </p>
    <button
      onclick={handleDelete}
      disabled={isDeleting}
      class="relative z-20 mt-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-red-500 opacity-70 transition hover:bg-red-500/10 hover:opacity-100 disabled:opacity-40"
      aria-label="Delete album"
    >
      <Trash2 class="h-4 w-4" />
      {isDeleting ? 'Deleting...' : m.remove()}
    </button></span
  >
</div>
