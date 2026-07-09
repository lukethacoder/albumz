<script lang="ts">
  import { trpc } from '$lib/trpc/client'
  import { albumsStore } from '$lib/stores/albums.svelte'

  let {
    albumId,
    rating = $bindable<number | null>(null),
    isComplete = false,
    readonly = false,
    size = 'md',
  }: {
    albumId: string
    rating?: number | null
    isComplete?: boolean
    readonly?: boolean
    size?: 'sm' | 'md'
  } = $props()

  let hovered = $state<number | null>(null)

  const display = $derived(hovered ?? rating ?? 0)

  const starSize = $derived(size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5')
  const gapSize = $derived(size === 'sm' ? 'gap-0.5' : 'gap-1')

  // For each of the 5 stars, compute fill: 'full' | 'half' | 'empty'
  function fill(star: number): 'full' | 'half' | 'empty' {
    if (display >= star) return 'full'
    if (display >= star - 0.5) return 'half'
    return 'empty'
  }

  // Which half of the star the pointer is over determines 0.5 increments
  function valueFromPointer(e: MouseEvent, star: number): number {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    return x < rect.width / 2 ? star - 0.5 : star
  }

  async function handleClick(e: MouseEvent, star: number) {
    if (readonly) return
    const next = valueFromPointer(e, star)
    // Clicking the current rating clears it
    const newRating = next === rating ? null : next
    rating = newRating
    hovered = null
    const promises: Promise<unknown>[] = [
      trpc.albums.update.mutate({ id: albumId, data: { rating: newRating } }),
    ]
    if (newRating !== null && !isComplete) {
      promises.push(albumsStore.toggleComplete(albumId, false))
    }
    await Promise.all(promises)
  }

  function handleMouseMove(e: MouseEvent, star: number) {
    if (readonly) return
    hovered = valueFromPointer(e, star)
  }

  function handleMouseLeave() {
    hovered = null
  }
</script>

<div
  class="flex items-center {gapSize}"
  onmouseleave={handleMouseLeave}
  role={readonly ? undefined : 'group'}
  aria-label={readonly ? `Rating: ${rating ?? 0} out of 5` : 'Star rating'}
>
  {#each [1, 2, 3, 4, 5] as star (star)}
    <button
      type="button"
      disabled={readonly}
      onmousemove={(e) => handleMouseMove(e, star)}
      onclick={(e) => handleClick(e, star)}
      aria-label="{star} star{star !== 1 ? 's' : ''}"
      class="text-amber-400 transition-colors {readonly
        ? 'cursor-default'
        : 'cursor-pointer hover:text-amber-300'} disabled:pointer-events-none"
    >
      <svg class={starSize} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="half-{star}-{albumId}">
            <stop offset="50%" stop-color="currentColor" />
            <stop offset="50%" stop-color="transparent" />
          </linearGradient>
        </defs>
        {#if fill(star) === 'full'}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        {:else if fill(star) === 'half'}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="url(#half-{star}-{albumId})"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        {:else}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="transparent"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
            class="text-zinc-600"
          />
        {/if}
      </svg>
    </button>
  {/each}
</div>
