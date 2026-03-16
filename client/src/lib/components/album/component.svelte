<script lang="ts">
  import { resolve } from '$app/paths'
  import { cn } from '$lib/utils'
  import type { RootProps } from './types'

  let { albumId, title, artist, coverUrl, releaseDate, onDeleteAlbum }: RootProps = $props()

  const releaseDateFormatted = releaseDate.split('-')[0]

  function handleSelectAlbum() {
    console.log('open a modal or slide out?')
  }
</script>

<div class="relative flex flex-col rounded-md hover:bg-neutral-800">
  <!-- <button
    aria-label="Select album"
    class="inset absolute h-full w-full cursor-pointer rounded-lg focus:outline-2 focus:outline-offset-2 focus:outline-emerald-500"
    onclick={handleSelectAlbum}
  ></button> -->
  <a
    href={resolve(`/albums/${albumId}`)}
    aria-label="Select album"
    class="inset absolute h-full w-full cursor-pointer rounded-lg focus:outline-2 focus:outline-offset-2 focus:outline-emerald-500"
    onclick={handleSelectAlbum}
  ></a>
  <span class="p-2">
    <span class="overflow-hidden rounded-lg">
      <img src={coverUrl} alt="album artwork" class="w-full max-w-full" />
    </span>
    <p class="mt-2 line-clamp-2 font-semibold uppercase dark:text-white">{title}</p>
    <p class="mt-0 line-clamp-1 dark:text-neutral-500">{releaseDateFormatted} • {artist}</p>
    <!-- <button onclick={() => onDeleteAlbum(albumId)}>🚮</button> --></span
  >
</div>
