<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { albumControllerDelete, client } from '$lib/api'
  import { Button } from '$lib/components'
  import { Check } from '@lucide/svelte'
  import Disc from '@lucide/svelte/icons/disc-3'

  // albums from server load
  let { data } = $props()
  let { album } = $derived(data)

  let isComplete = $state(false)

  async function deleteAlbum() {
    if (album) {
      const { error } = await albumControllerDelete({ client, path: { id: album.id } })
      if (!error) {
        // refresh or update local state
        await invalidateAll()
      }
    }
  }

  const handleMarkComplete = async () => {
    console.log('TODO: hook up to DB ')
    isComplete = !isComplete
  }
</script>

<svelte:head>
  <title>{album?.title} | {album?.title}</title>
</svelte:head>

<section class="flex h-full w-full items-center justify-center">
  <div class="container mx-auto grid w-full gap-4 px-2 sm:grid-cols-2 md:gap-8">
    {#if album}
      <div class="w-full">
        <div
          class="relative mx-auto flex aspect-square w-full max-w-96 items-center justify-center rounded-lg"
        >
          {#if album?.coverUrl}
            <span class="absolute h-full w-full opacity-50 blur-lg">
              <img src={album?.coverUrl} alt={`Album artwork for ${album.title}`} />
            </span>
            <span class="relative z-10 mx-auto p-2">
              <img
                src={album?.coverUrl}
                alt={`Album artwork for ${album.title}`}
                class=" rounded-lg"
              />
            </span>
          {:else}
            <span class="mx-auto flex w-1/2 items-center justify-center">
              <Disc class="h-full w-full text-emerald-600" />
            </span>
          {/if}
        </div>
      </div>
      <div class="mt-10 w-full">
        <div class="mx-auto flex max-w-full flex-col">
          <h1 class="text-4xl dark:text-white">{album.title}</h1>
          <h2 class="text-md dark:text-neutral-500">{album.artist}</h2>
        </div>
        <div class="mt-4 flex gap-1">
          <Button.Root
            variant="outline"
            theme={isComplete ? 'brand' : 'neutral'}
            onclick={handleMarkComplete}
          >
            {#snippet iconLeft()}
              {#if isComplete}
                <Check />
              {/if}
            {/snippet}
            {isComplete ? 'Mark incomplete' : 'Mark complete'}
          </Button.Root>
          <Button.Root variant="ghost" theme="negative" onclick={deleteAlbum}>Remove</Button.Root>
        </div>
        <!-- <Album.Root
        albumId={album.id}
        title={album.title}
        artist={album.artist}
        releaseDate={album.releaseDate}
        coverUrl={album.coverUrl}
        onDeleteAlbum={deleteAlbum}
      /> -->
      </div>
    {/if}
  </div>
</section>
