<script lang="ts">
  import { cn } from '$lib/utils'
  import { Label, mergeProps, useId } from 'bits-ui'
  import type { RootProps } from './types'

  let {
    id = useId(),
    ref = $bindable(null),
    value = $bindable(),
    type,
    files = $bindable(),
    class: className,
    'data-slot': dataSlot = 'input',
    labelRef = $bindable(null),
    label,
    labelProps,
    ...restProps
  }: RootProps = $props()

  const mergedLabelProps = $derived(
    mergeProps(labelProps, {
      class: cn('mb-1.5 block text-sm font-medium text-zinc-700', labelProps?.class),
    }),
  )
</script>

{#if label}
  <Label.Root for={id} bind:ref={labelRef} {...mergedLabelProps}>
    {label}
  </Label.Root>
{/if}

{#if type === 'file'}
  <input
    {id}
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      'h-9 w-full min-w-0 rounded-md border border-zinc-900/20 bg-transparent px-3 py-1 text-sm text-zinc-700 transition-colors',
      'placeholder:text-zinc-500',
      'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-700',
      'focus-visible:border-zinc-900/40 focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:outline-none',
      'aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20',
      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:file:text-zinc-300',
      'dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20',
      'dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20',
      className,
    )}
    type="file"
    bind:files
    bind:value
    {...restProps}
  />
{:else if type === 'range'}
  <input
    {id}
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      'h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 transition-colors',
      // Track
      '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-200',
      '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-zinc-200 [&::-moz-range-track]:border-0',
      // Thumb - webkit needs -mt-1 (4px) to center 16px thumb on 8px track
      '[&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
      '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-emerald-600 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110',
      // Focus
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20 focus-visible:ring-offset-2',
      '[&:focus-visible::-webkit-slider-thumb]:ring-2 [&:focus-visible::-webkit-slider-thumb]:ring-emerald-600/30',
      '[&:focus-visible::-moz-range-thumb]:ring-2 [&:focus-visible::-moz-range-thumb]:ring-emerald-600/30',
      // Disabled
      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      // Dark mode - Track
      'dark:bg-zinc-700',
      'dark:[&::-webkit-slider-runnable-track]:bg-zinc-700',
      'dark:[&::-moz-range-track]:bg-zinc-700',
      // Dark mode - Thumb
      'dark:[&::-webkit-slider-thumb]:bg-emerald-500',
      'dark:[&::-moz-range-thumb]:bg-emerald-500',
      // Dark mode - Focus
      'dark:focus-visible:ring-emerald-500/20',
      'dark:[&:focus-visible::-webkit-slider-thumb]:ring-emerald-500/30',
      'dark:[&:focus-visible::-moz-range-thumb]:ring-emerald-500/30',
      className,
    )}
    type="range"
    bind:value
    {...restProps}
  />
{:else}
  <input
    {id}
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      'h-9 w-full min-w-0 rounded-md border border-zinc-900/20 bg-transparent px-3 py-1 text-sm text-zinc-700 transition-colors',
      'placeholder:text-zinc-500',
      'focus-visible:border-zinc-900/40 focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:outline-none',
      'aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20',
      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-white/15 dark:bg-white/5 dark:text-zinc-300',
      'dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20',
      'dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20',
      className,
    )}
    {type}
    bind:value
    {...restProps}
  />
{/if}
