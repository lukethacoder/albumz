<script lang="ts">
  import { resolve } from '$app/paths'
  import { Check, Disc, Trash2 } from '@lucide/svelte'
  import { albumsStore } from '$lib/stores/albums.svelte'
  import { getRelativeTime } from '$lib/utils'
  import { StarRating } from '$lib/components'
  import type { RootProps } from './types'

  let {
    albumId,
    title,
    artist,
    coverUrl,
    releaseDate,
    dateCompleted,
    genre,
    createdAt,
    rating = null,
    selected = false,
    onToggleSelect,
    onDeleteAlbum,
  }: RootProps = $props()

  const releaseYear = $derived(releaseDate ? releaseDate.split('-')[0] : '—')
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

<tr
  onclick={onToggleSelect ? (e) => onToggleSelect!(albumId, e.shiftKey) : undefined}
  class="group border-b border-zinc-800 transition-colors hover:bg-neutral-800
    {selected ? 'bg-emerald-950/30' : ''}
    {onToggleSelect ? 'cursor-pointer select-none' : ''}"
>
  <!-- Artwork -->
  <td class="w-14 p-2 pl-3">
    <span class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-md">
      {#if coverUrl}
        <img src={coverUrl} alt="album artwork" class="h-full w-full object-cover" />
      {:else}
        <span class="flex h-full w-full items-center justify-center bg-neutral-900">
          <Disc class="h-5 w-5 text-emerald-600" />
        </span>
      {/if}
      {#if onToggleSelect}
        <span
          class="absolute inset-0 flex items-center justify-center rounded-md transition
            {selected ? 'bg-emerald-500/80' : 'bg-black/50 opacity-0 group-hover:opacity-100'}"
        >
          {#if selected}
            <Check class="h-4 w-4 text-white" />
          {/if}
        </span>
      {/if}
    </span>
  </td>

  <!-- Album name -->
  <td class="py-2 pr-4 font-funnel font-bold dark:text-neutral-300">
    {#if onToggleSelect}
      <span>{title}</span>
    {:else}
      <a
        href={resolve(`/albums/${albumId}`)}
        class="hover:underline focus:outline-none focus-visible:underline"
        onclick={(e) => e.stopPropagation()}
      >
        {title}
      </a>
    {/if}
  </td>

  <!-- Artist -->
  <td class="py-2 pr-4 text-sm dark:text-neutral-400">{artist}</td>

  <!-- Release year -->
  <td class="py-2 pr-4 text-sm tabular-nums dark:text-neutral-500">{releaseYear}</td>

  <!-- Genre -->
  <td class="py-2 pr-4 text-sm dark:text-neutral-500">
    {#if genre}
      <span class="flex flex-wrap gap-x-1">
        {#each genre
          .split(';')
          .map((g) => g.trim())
          .filter(Boolean) as g, i (g)}
          {#if i > 0}<span class="text-neutral-600">•</span>{/if}
          <a
            href="/?genres={encodeURIComponent(g)}"
            onclick={(e) => e.stopPropagation()}
            class="hover:text-neutral-300 hover:underline">{g}</a
          >
        {/each}
      </span>
    {:else}
      —
    {/if}
  </td>

  <!-- Rating -->
  <td class="py-2 pr-4" onclick={(e) => e.stopPropagation()}>
    <StarRating.Root {albumId} bind:rating {isComplete} size="sm" readonly={!!onToggleSelect} />
  </td>

  <!-- Date added -->
  <td class="py-2 pr-4 text-sm dark:text-neutral-500">
    {createdAt ? getRelativeTime(new Date(createdAt), new Date(), true) : '—'}
  </td>

  <!-- Actions -->
  <td class="py-2 pr-3">
    {#if !onToggleSelect}
      <div
        class="flex justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <button
          onclick={handleToggleComplete}
          disabled={isLoading}
          class="flex cursor-pointer items-center justify-center rounded-md bg-neutral-700/60 p-1.5 transition disabled:opacity-40
            {isComplete
            ? 'text-emerald-400 hover:bg-neutral-700'
            : 'text-white/70 hover:bg-neutral-700 hover:text-white'}"
          aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
        >
          <Check class="h-3.5 w-3.5" />
        </button>
        <button
          onclick={handleDelete}
          disabled={isLoading}
          class="flex cursor-pointer items-center justify-center rounded-md bg-neutral-700/60 p-1.5 text-red-400 transition hover:bg-neutral-700 disabled:opacity-40"
          aria-label="Delete album"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    {/if}
  </td>
</tr>
