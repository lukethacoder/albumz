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
      'focus-visible:border-zinc-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20',
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
{:else}
  <input
    {id}
    bind:this={ref}
    data-slot={dataSlot}
    class={cn(
      'h-9 w-full min-w-0 rounded-md border border-zinc-900/20 bg-transparent px-3 py-1 text-sm text-zinc-700 transition-colors',
      'placeholder:text-zinc-500',
      'focus-visible:border-zinc-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20',
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
