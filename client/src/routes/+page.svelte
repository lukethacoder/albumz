<script lang="ts">
  import { Album } from '$lib/components/album/index.js'

  // albums from server load
  let { data } = $props()
</script>

<svelte:head>
  <title>Home - Albumz</title>
</svelte:head>

<section class="w-full">
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
</section>
