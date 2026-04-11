<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { trpc } from '$lib/trpc/client'
  import { Button, Input } from '$lib/components'
  import { TRPCClientError } from '@trpc/client'

  let { data } = $props()
  const { album } = $derived(data)

  let title = $state(album.title)
  let artist = $state(album.artist)
  let releaseDate = $state(album.releaseDate ?? '')
  let coverUrl = $state(album.coverUrl ?? '')
  let mbid = $state(album.mbid ?? '')

  let loading = $state(false)
  let error = $state<string | null>(null)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = null

    try {
      await trpc.albums.update.mutate({
        id: album.id,
        data: {
          title,
          artist,
          releaseDate: releaseDate || undefined,
          coverUrl: coverUrl || undefined,
          mbid: mbid || undefined,
        },
      })
      goto(resolve(`/albums/${album.id}`))
    } catch (err) {
      if (err instanceof TRPCClientError) {
        error = err.message
      } else {
        error = 'An error occurred. Please try again.'
      }
      loading = false
    }
  }
</script>

<svelte:head>
  <title>{album.title} - Edit - Albumz</title>
</svelte:head>

<section
  class="relative flex h-full w-full items-center justify-center px-8 py-12 lg:py-16 xl:py-20"
>
  <div class="w-full max-w-lg space-y-6">
    <div>
      <h1 class="font-funnel text-4xl font-bold">Edit Album</h1>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {album.title} — {album.artist}
      </p>
    </div>

    {#if error}
      <div class="rounded-md bg-red-50 p-4 dark:bg-red-950/30">
        <p class="text-sm text-red-800 dark:text-red-400">{error}</p>
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-4">
      <Input.Root
        label="Album Title"
        type="text"
        placeholder="e.g. Paranoid"
        bind:value={title}
        required
      />
      <Input.Root
        label="Artist"
        type="text"
        placeholder="e.g. Black Sabbath"
        bind:value={artist}
        required
      />
      <Input.Root label="Release Date" type="date" bind:value={releaseDate} />
      <Input.Root
        label="Album Artwork URL"
        type="url"
        placeholder="https://..."
        bind:value={coverUrl}
      />
      <Input.Root
        label="MusicBrainz Release ID"
        type="text"
        placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
        bind:value={mbid}
      />

      <div class="flex gap-3">
        <Button.Root type="submit" {loading} disabled={loading} size="lg" class="flex-1">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button.Root>
        <Button.Root
          type="button"
          variant="outline"
          theme="neutral"
          size="lg"
          onclick={() => goto(resolve(`/albums/${album.id}`))}
          disabled={loading}
        >
          Cancel
        </Button.Root>
      </div>
    </form>
  </div>
</section>
