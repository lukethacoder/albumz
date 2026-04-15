<script lang="ts">
  import { Button } from '$lib/components'
  import { m } from '$lib/paraglide/messages.js'
  import { cn, getRelativeTime, translateError } from '$lib/utils'
  import { Check, RefreshCw, Pencil, ImagePlus, X } from '@lucide/svelte'
  import Disc from '@lucide/svelte/icons/disc-3'
  import { albumsStore } from '$lib/stores/albums.svelte'
  import { trpc } from '$lib/trpc/client'
  import { invalidateAll } from '$app/navigation'
  import { TRPCClientError } from '@trpc/client'
  import { Dialog } from 'bits-ui'

  import {
    siApplemusic,
    siLastdotfm,
    siMusicbrainz,
    siSpotify,
    siYoutube,
    type SimpleIcon,
  } from 'simple-icons'

  // albums from server load
  let { data } = $props()
  let { album, enabledServices } = $derived(data)

  // Empty array means all services are enabled (default state)
  const isServiceEnabled = (key: string) =>
    enabledServices.length === 0 || enabledServices.includes(key)

  // Check if album is completed based on dateCompleted field
  let isComplete = $derived(!!album.dateCompleted)

  // Track loading and error state for this album
  let isLoading = $derived(albumsStore.isLoading(album.id))
  let error = $derived(albumsStore.getError(album.id))

  let refreshing = $state(false)
  let refreshError = $state<string | null>(null)

  // Artwork picker modal state
  let artworkModalOpen = $state(false)
  let artworkResults = $state<Array<{ url: string; source: string }>>([])
  let artworkLoading = $state(false)
  let artworkSaving = $state(false)

  async function deleteAlbum() {
    if (album) {
      await albumsStore.deleteWithConfirm(album.id, album.title, true)
    }
  }

  const handleMarkComplete = async () => {
    await albumsStore.toggleComplete(album.id, isComplete)
  }

  async function handleRefreshMetadata() {
    refreshing = true
    refreshError = null
    try {
      await trpc.albums.refreshMetadata.mutate({ id: album.id })
      await invalidateAll()
    } catch (err) {
      if (err instanceof TRPCClientError) {
        refreshError = translateError(err.message)
      } else {
        refreshError = m.failed_to_refresh_metadata()
      }
    } finally {
      refreshing = false
    }
  }

  async function openArtworkModal() {
    artworkModalOpen = true
    if (artworkResults.length > 0) return
    artworkLoading = true
    try {
      artworkResults = await trpc.albums.findArtwork.mutate({
        artist: album.artist,
        album: album.title,
      })
    } catch {
      // silently fail — show empty state
    } finally {
      artworkLoading = false
    }
  }

  async function handleSelectArtwork(url: string) {
    artworkSaving = true
    try {
      await trpc.albums.update.mutate({ id: album.id, data: { coverUrl: url } })
      await invalidateAll()
      artworkModalOpen = false
    } finally {
      artworkSaving = false
    }
  }

  type ArtworkSourceIcon = { type: 'simple'; icon: SimpleIcon } | { type: 'url'; url: string }

  function getSourceIcon(source: string): ArtworkSourceIcon | null {
    switch (source) {
      case 'spotify':
        return { type: 'simple', icon: siSpotify }
      case 'lastfm':
        return { type: 'simple', icon: siLastdotfm }
      case 'musicbrainz':
        return { type: 'simple', icon: siMusicbrainz }
      case 'navidrome':
        return {
          type: 'url',
          url: 'https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/navidrome.svg',
        }
      default:
        return null
    }
  }

  type Link = { icon?: SimpleIcon; iconUrl?: string; label: string; url: string }

  const links = $derived(
    [
      album.urlLastFm && isServiceEnabled('lastfm')
        ? { icon: siLastdotfm, label: 'Last.fm', url: album.urlLastFm }
        : null,
      album.urlSpotify && isServiceEnabled('spotify')
        ? { icon: siSpotify, label: 'Spotify', url: album.urlSpotify }
        : null,
      album.urlAppleMusic && isServiceEnabled('applemusic')
        ? { icon: siApplemusic, label: 'Apple Music', url: album.urlAppleMusic }
        : null,
      (album.urlYoutubeMusic || album.urlYoutube) && isServiceEnabled('youtube')
        ? {
            icon: siYoutube,
            label: 'YouTube',
            url: (album.urlYoutubeMusic || album.urlYoutube)!,
          }
        : null,
      album.mbid && isServiceEnabled('musicbrainz')
        ? {
            icon: siMusicbrainz,
            label: 'MusicBrainz',
            url: `https://musicbrainz.org/release/${album.mbid}`,
          }
        : null,
      album.urlRateYourMusic && isServiceEnabled('rateyourmusic')
        ? {
            iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Rate_Your_Music_logo.svg',
            label: 'Rate Your Music',
            url: album.urlRateYourMusic,
          }
        : null,
      album.urlNavidrome && isServiceEnabled('navidrome')
        ? {
            iconUrl: 'https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/navidrome.svg',
            label: 'Navidrome',
            url: album.urlNavidrome,
          }
        : null,
    ].filter((l): l is NonNullable<typeof l> => l !== null),
  )
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
          class="group relative mx-auto flex aspect-square w-full max-w-xl items-center justify-center rounded-lg"
        >
          {#if album?.coverUrl}
            <span class="absolute h-full w-full opacity-50 blur-lg">
              <img src={album?.coverUrl} alt={`Album artwork for ${album.title}`} />
            </span>
            <span class="relative z-10 mx-auto w-full p-2">
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
          <button
            class="absolute top-4 right-4 z-20 cursor-pointer rounded-full bg-black/60 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            onclick={openArtworkModal}
            aria-label="Edit artwork"
          >
            <ImagePlus class="h-4 w-4" />
          </button>
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
          {#if album.genre}
            <p class="mt-1 font-geist text-sm dark:text-neutral-600">
              {#each album.genre
                .split(';')
                .map((g) => g.trim())
                .filter(Boolean) as g, i (g)}
                {#if i > 0}<span>&nbsp;•</span>{/if}
                <a
                  href="/?genres={encodeURIComponent(g)}"
                  class="transition hover:text-neutral-400 hover:underline">{g}</a
                >
              {/each}
            </p>
          {/if}
        </div>
        <div class="mt-4 flex flex-col gap-2">
          {#if error || refreshError}
            <div class="rounded-md bg-red-50 p-3">
              <p class="text-sm text-red-800">{error ?? refreshError}</p>
            </div>
          {/if}

          <div class="flex justify-start gap-1">
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
              disabled={isLoading}
              onclick={deleteAlbum}
            >
              {isLoading ? m.processing() : m.remove()}
            </Button.Root>
            <Button.Root
              variant="ghost"
              theme="neutral"
              aria-label={refreshing ? m.refreshing() : m.refresh_metadata()}
              disabled={refreshing}
              loading={refreshing}
              onclick={handleRefreshMetadata}
            >
              {#snippet iconLeft()}
                {#if !refreshing}
                  <RefreshCw />
                {/if}
              {/snippet}
            </Button.Root>
            <Button.Root
              variant="ghost"
              theme="neutral"
              aria-label={m.edit_metadata()}
              href="/albums/{album.id}/edit"
            >
              {#snippet iconLeft()}
                <Pencil />
              {/snippet}
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
        {#if links.length > 0}
          <ul class="flex gap-3">
            {#each links as link (link.url)}
              <li>
                <a
                  href={link.url}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  class={cn(
                    'flex h-8 w-8 fill-neutral-500 p-1 opacity-50 transition hover:opacity-100',
                    { grayscale: !!link.iconUrl },
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
        {/if}
      </div>
    {/if}
  </div>
</section>

<!-- Artwork picker modal -->
<Dialog.Root bind:open={artworkModalOpen}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 flex max-h-[80vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-zinc-950 p-6 shadow-2xl ring-1 ring-white/10"
    >
      <div class="mb-4 flex items-center justify-between">
        <Dialog.Title class="text-lg font-semibold text-neutral-200">Select Artwork</Dialog.Title>
        <Dialog.Close
          class="rounded-md p-1 text-zinc-500 transition hover:text-zinc-200"
          aria-label="Close"
        >
          <X class="h-5 w-5" />
        </Dialog.Close>
      </div>
      <Dialog.Description class="sr-only">
        Choose artwork for {album?.title}
      </Dialog.Description>

      <div class="flex-1 overflow-y-auto">
        {#if artworkLoading}
          <div class="flex flex-col items-center justify-center gap-3 py-16">
            <svg
              class="h-8 w-8 animate-spin text-emerald-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p class="text-sm text-zinc-400">Loading artwork...</p>
          </div>
        {:else if artworkResults.length === 0}
          <p class="py-16 text-center text-sm text-zinc-400">No artwork found.</p>
        {:else}
          <div class="grid grid-cols-3 gap-3 p-0.5">
            {#each artworkResults as result (result.url)}
              {@const icon = getSourceIcon(result.source)}
              <button
                class="group/item relative overflow-hidden rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                onclick={() => handleSelectArtwork(result.url)}
                disabled={artworkSaving}
              >
                <img
                  src={result.url}
                  alt="Album artwork"
                  class="aspect-square w-full object-cover transition group-hover/item:brightness-75"
                />
                {#if icon}
                  <div
                    class="absolute right-1.5 bottom-1.5 flex h-5 w-5 items-center justify-center p-0.5 shadow-xl"
                  >
                    {#if icon.type === 'simple'}
                      <svg
                        role="img"
                        viewBox="0 0 24 24"
                        class="fill-white"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d={icon.icon.path} />
                      </svg>
                    {:else if icon.type === 'url'}
                      <img src={icon.url} alt={result.source} class="h-full w-full" />
                    {/if}
                  </div>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
