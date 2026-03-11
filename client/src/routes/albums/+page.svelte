<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { albumControllerDelete } from '$lib/api/generated'

  // albums from server load
  let { data } = $props()

  async function deleteAlbum(id: string) {
    const { error } = await albumControllerDelete({ path: { id } })
    if (!error) {
      // refresh or update local state
      await invalidateAll()
    }
  }
</script>

<ul class="grid grid-cols-3 gap-2 p-2">
  {#each data.albums as album (album.id)}
    <li class="w-full">
      <img src={album.coverUrl} alt="album artwork" class="max-w-full" />
      <p>{album.title} — {album.artist}</p>
      <button onclick={() => deleteAlbum(album.id)}>Delete</button>
    </li>
  {/each}
</ul>
