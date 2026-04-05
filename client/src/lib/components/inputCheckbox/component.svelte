<script lang="ts">
  import { Checkbox as CheckboxPrimitive, Label, mergeProps, useId } from 'bits-ui'
  import { cn } from '$lib/utils'
  import CheckIcon from '@lucide/svelte/icons/check'
  import MinusIcon from '@lucide/svelte/icons/minus'
  import type { RootProps } from './types'

  let {
    id = useId(),
    ref = $bindable(null),
    checked = $bindable(false),
    indeterminate = $bindable(false),
    class: className,
    labelRef = $bindable(null),
    label,
    labelProps,
    ...restProps
  }: RootProps = $props()

  const mergedLabelProps = $derived(
    mergeProps(labelProps, {
      class: cn('cursor-pointer text-sm font-medium text-zinc-700', labelProps?.class),
    }),
  )
</script>

<div class="flex items-center gap-2">
  <CheckboxPrimitive.Root
    {id}
    bind:ref
    data-slot="checkbox"
    class={cn(
      'peer relative flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-zinc-900/20 bg-transparent shadow-xs transition-all outline-none',
      'data-checked:border-emerald-600 data-checked:bg-emerald-600 data-checked:text-white',
      'focus-visible:border-zinc-900/40 focus-visible:ring-2 focus-visible:ring-zinc-900/20',
      'aria-invalid:border-red-600 aria-invalid:ring-2 aria-invalid:ring-red-600/20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-white/15 dark:bg-white/5',
      'dark:data-checked:border-emerald-500 dark:data-checked:bg-emerald-500',
      'dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20',
      'dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20',
      className,
    )}
    bind:checked
    bind:indeterminate
    {...restProps}
  >
    {#snippet children({ checked, indeterminate })}
      <div
        data-slot="checkbox-indicator"
        class="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        {#if checked}
          <CheckIcon />
        {:else if indeterminate}
          <MinusIcon />
        {/if}
      </div>
    {/snippet}
  </CheckboxPrimitive.Root>
  {#if label}
    <Label.Root for={id} bind:ref={labelRef} {...mergedLabelProps}>
      {label}
    </Label.Root>
  {/if}
</div>
