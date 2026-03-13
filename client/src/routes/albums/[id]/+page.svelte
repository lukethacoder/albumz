<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { albumControllerDelete, client } from '$lib/api'
  import { Button } from '$lib/components'
  import { Album } from '$lib/components/album/index.js'

  // albums from server load
  let { data } = $props()

  async function deleteAlbum(id: string) {
    const { error } = await albumControllerDelete({ client, path: { id } })
    if (!error) {
      // refresh or update local state
      await invalidateAll()
    }
  }
</script>

<section class="w-full">
  <h1>albumz</h1>
  <p>hello world</p>
  <div>
    <Button.Root>nah</Button.Root>
  </div>
  <ul
    class="mx-auto grid w-full grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-2 p-2"
  >
    {#if data.album}
      <li class="flex h-full w-full">
        <Album.Root
          albumId={data.album.id}
          title={data.album.title}
          artist={data.album.artist}
          releaseDate={data.album.releaseDate}
          coverUrl={data.album.coverUrl}
          onDeleteAlbum={deleteAlbum}
        />
      </li>
    {/if}
  </ul>
</section>
