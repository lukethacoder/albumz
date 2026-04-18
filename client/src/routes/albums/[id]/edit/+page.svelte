<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { trpc } from '$lib/trpc/client'
  import { Button, Input, InputCombobox } from '$lib/components'
  import { TRPCClientError } from '@trpc/client'
  import { m } from '$lib/paraglide/messages'
  import { translateError } from '$lib/utils'

  let { data } = $props()
  const { album } = $derived(data)

  const genreOptions = $derived(data.availableGenres.map((g) => ({ value: g, label: g })))

  // Metadata tab
  let title = $state(album.title)
  let artist = $state(album.artist)
  let releaseDate = $state(album.releaseDate ?? '')
  let coverUrl = $state(album.coverUrl ?? '')
  let mbid = $state(album.mbid ?? '')
  let selectedGenres = $state<string[]>(
    album.genre
      ? album.genre
          .split(';')
          .map((g) => g.trim())
          .filter(Boolean)
      : [],
  )

  // External services tab
  let urlLastFm = $state(album.urlLastFm ?? '')
  let urlSpotify = $state(album.urlSpotify ?? '')
  let urlAppleMusic = $state(album.urlAppleMusic ?? '')
  let urlYoutube = $state(album.urlYoutube ?? '')
  let urlYoutubeMusic = $state(album.urlYoutubeMusic ?? '')
  let urlRateYourMusic = $state(album.urlRateYourMusic ?? '')

  let activeTab = $state<'metadata' | 'external'>('metadata')
  let loading = $state(false)
  let error = $state<string | null>(null)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = null

    try {
      const updateData: Record<string, unknown> = {
        title,
        artist,
        releaseDate: releaseDate || undefined,
        coverUrl: coverUrl || undefined,
        mbid: mbid || undefined,
        genre: selectedGenres.length > 0 ? selectedGenres.join(';') : undefined,
      }

      // Add external service URLs if they've been changed
      if (urlLastFm) updateData.urlLastFm = urlLastFm
      if (urlSpotify) updateData.urlSpotify = urlSpotify
      if (urlAppleMusic) updateData.urlAppleMusic = urlAppleMusic
      if (urlYoutube) updateData.urlYoutube = urlYoutube
      if (urlYoutubeMusic) updateData.urlYoutubeMusic = urlYoutubeMusic
      if (urlRateYourMusic) updateData.urlRateYourMusic = urlRateYourMusic

      await trpc.albums.update.mutate({
        id: album.id,
        data: updateData,
      })
      goto(resolve(`/albums/${album.id}`))
    } catch (err) {
      if (err instanceof TRPCClientError) {
        error = translateError(err.message)
      } else {
        error = m.an_error_occurred()
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
      <h1 class="font-funnel text-4xl font-bold capitalize">{m.edit_album()}</h1>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {album.title} — {album.artist}
      </p>
    </div>

    {#if error}
      <div class="rounded-md bg-red-50 p-4 dark:bg-red-950/30">
        <p class="text-sm text-red-800 dark:text-red-400">{error}</p>
      </div>
    {/if}

    <!-- Tab Navigation -->
    <div
      class="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <button
        type="button"
        onclick={() => (activeTab = 'metadata')}
        class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
        'metadata'
          ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}"
      >
        Metadata
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'external')}
        class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
        'external'
          ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}"
      >
        External Services
      </button>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      <!-- Metadata Tab -->
      {#if activeTab === 'metadata'}
        <div class="space-y-4">
          <Input.Root
            label={m.album_title()}
            type="text"
            placeholder="e.g. Paranoid"
            bind:value={title}
            required
          />
          <Input.Root
            label={m.artist()}
            type="text"
            placeholder="e.g. Black Sabbath"
            bind:value={artist}
            required
          />
          <Input.Root label={m.release_date()} type="date" bind:value={releaseDate} />
          <Input.Root
            label={m.album_artwork_url()}
            type="url"
            placeholder="https://..."
            bind:value={coverUrl}
          />
          <Input.Root
            label={m.musicbrainz_release_id()}
            type="text"
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            bind:value={mbid}
          />
          <InputCombobox.Root
            id="genre-edit"
            type="multiple-chip"
            label={m.genre()}
            items={genreOptions}
            bind:value={selectedGenres}
            allowNewValue
          />
        </div>
      {/if}

      <!-- External Services Tab -->
      {#if activeTab === 'external'}
        <div class="space-y-4">
          <div class="mb-4 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/50">
            <p class="text-xs text-zinc-600 dark:text-zinc-400">
              Add or update URLs for external music services. Leave blank to remove a link.
            </p>
          </div>

          <Input.Root
            label="Last.fm"
            type="url"
            placeholder="https://www.last.fm/music/..."
            bind:value={urlLastFm}
          />
          <Input.Root
            label="Spotify"
            type="url"
            placeholder="https://open.spotify.com/album/..."
            bind:value={urlSpotify}
          />
          <Input.Root
            label="Apple Music"
            type="url"
            placeholder="https://music.apple.com/..."
            bind:value={urlAppleMusic}
          />
          <Input.Root
            label="YouTube"
            type="url"
            placeholder="https://www.youtube.com/..."
            bind:value={urlYoutube}
          />
          <Input.Root
            label="YouTube Music"
            type="url"
            placeholder="https://music.youtube.com/..."
            bind:value={urlYoutubeMusic}
          />
          <Input.Root
            label="Rate Your Music"
            type="url"
            placeholder="https://rateyourmusic.com/..."
            bind:value={urlRateYourMusic}
          />
        </div>
      {/if}

      <div class="flex gap-3">
        <Button.Root type="submit" {loading} disabled={loading} size="lg" class="flex-1">
          {loading ? m.saving() : m.save_changes()}
        </Button.Root>
        <Button.Root
          type="button"
          variant="outline"
          theme="neutral"
          size="lg"
          onclick={() => goto(resolve(`/albums/${album.id}`))}
          disabled={loading}
        >
          {m.cancel()}
        </Button.Root>
      </div>
    </form>
  </div>
</section>
