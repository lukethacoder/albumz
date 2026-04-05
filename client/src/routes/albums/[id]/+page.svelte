<script lang="ts">
  import { Button } from '$lib/components'
  import { m } from '$lib/paraglide/messages.js'
  import { cn, getRelativeTime } from '$lib/utils'
  import { Check } from '@lucide/svelte'
  import Disc from '@lucide/svelte/icons/disc-3'
  import { albumsStore } from '$lib/stores/albums.svelte'

  import { siMusicbrainz, siSpotify, siYoutube, type SimpleIcon } from 'simple-icons'

  // albums from server load
  let { data } = $props()
  let { album } = $derived(data)

  // Check if album is completed based on dateCompleted field
  let isComplete = $derived(!!album.dateCompleted)

  // Track loading and error state for this album
  let isLoading = $derived(albumsStore.isLoading(album.id))
  let error = $derived(albumsStore.getError(album.id))

  async function deleteAlbum() {
    if (album) {
      // Delete and redirect to home page after success
      await albumsStore.deleteWithConfirm(album.id, album.title, true)
    }
  }

  const handleMarkComplete = async () => {
    await albumsStore.toggleComplete(album.id, isComplete)
  }

  // SimpleIcon OR iconUrl
  // TODO: feature enable services
  // - backend should run an async job to find the "exact match"
  // - until the backend runs, use the `?s=${artist} ${album}` for services that support search
  const links: { icon?: SimpleIcon; iconUrl?: string; label: string; url: string }[] = [
    {
      icon: siSpotify,
      label: 'Spotify',
      url: 'https://open.spotify.com/',
    },
    {
      icon: siYoutube,
      label: 'Youtube',
      url: 'https://open.youtube.com/',
    },
    {
      icon: siMusicbrainz,
      label: 'MusicBrainz',
      url: 'musicbrainz',
    },
    {
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Rate_Your_Music_logo.svg',
      label: 'Rate your music',
      url: 'rym',
    },
    {
      iconUrl: 'https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/navidrome.svg',
      label: 'Navidrome',
      url: 'navidrome',
    },
  ]
</script>

<svelte:head>
  <title>{album?.title} - {album?.artist} - Albumz</title>
</svelte:head>

<section
  class="relative flex h-full w-full items-center justify-center px-8 py-12 lg:py-16 xl:py-20"
>
  <div class="container mx-auto flex w-full flex-col gap-4 px-2 sm:flex-row sm:gap-12 md:gap-16">
    {#if album}
      <div class="">
        <div
          class="relative mx-auto flex aspect-square w-full max-w-xl items-center justify-center rounded-lg"
        >
          {#if album?.coverUrl}
            <span class="absolute h-full w-full opacity-50 blur-lg">
              <img src={album?.coverUrl} alt={`Album artwork for ${album.title}`} />
            </span>
            <span class="relative z-10 mx-auto p-2">
              <img
                src={album?.coverUrl}
                alt={`Album artwork for ${album.title}`}
                class="rounded-lg"
              />
            </span>
          {:else}
            <span class="mx-auto flex w-1/2 items-center justify-center">
              <Disc class="h-full w-full text-emerald-600" />
            </span>
          {/if}
        </div>
      </div>
      <div class="mt-4 w-full sm:mt-10">
        <div class="mx-auto flex max-w-full flex-col">
          <h1 class="mb-2 text-4xl md:mb-4 lg:text-6xl xl:text-7xl dark:text-neutral-300">
            {album.title}
          </h1>
          <h2 class="text-md font-geist font-medium dark:text-neutral-500">
            <!-- TODO: artist should be clickable (prefill search) -->
            <span>{album.artist}</span> •
            <span class="capitalize"> {m.release_date()} {album.releaseDate ?? 'Unknown'}</span>
          </h2>
        </div>
        <div class="mt-4 flex flex-col gap-2">
          {#if error}
            <div class="rounded-md bg-red-50 p-3">
              <p class="text-sm text-red-800">{error}</p>
            </div>
          {/if}

          <div class="flex gap-1">
            <Button.Root
              variant="outline"
              theme={isComplete ? 'brand' : 'neutral'}
              class="capitalize"
              onclick={handleMarkComplete}
              disabled={isLoading}
            >
              {#snippet iconLeft()}
                {#if isComplete}
                  <Check />
                {/if}
              {/snippet}
              {isComplete ? m.mark_incomplete() : m.mark_complete()}
            </Button.Root>
            <Button.Root
              variant="ghost"
              theme="negative"
              class="capitalize"
              onclick={deleteAlbum}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : m.remove()}
            </Button.Root>
          </div>
        </div>
        <div class="mt-4 mb-3">
          <h2 class="text-md font-geist font-medium dark:text-neutral-500">
            <span class="capitalize">{m.added()}</span>
            <time datetime={album.createdAt.toLocaleString()}>
              {getRelativeTime(new Date(album.createdAt))}
            </time>
          </h2>
        </div>
        <ul class="flex gap-3">
          {#each links as link (link.url)}
            <li>
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
              <a
                href={link.url}
                aria-label={link.label}
                target="_blank"
                class={cn(
                  'flex h-8 w-8 fill-neutral-500 p-1 opacity-50 transition hover:opacity-100',
                  {
                    grayscale: link.iconUrl,
                  },
                )}
              >
                {#if link.icon}
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <title>{link.label}</title>
                    <path d={link.icon.path} />
                  </svg>
                {:else if link.iconUrl}
                  <img src={link.iconUrl} alt={link.label} />
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</section>
