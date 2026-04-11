<script lang="ts">
  import { mergeProps, Select, Label, useId, type WithoutChildren } from 'bits-ui'
  import { cn } from '$lib/utils'
  import type { RootProps } from './types'

  let {
    id = useId(),
    value = $bindable(),
    type,
    items,
    contentProps,
    triggerProps,
    placeholder,
    label,
    labelRef = $bindable(null),
    labelProps,
    ...restProps
  }: RootProps = $props()

  // Default to 'single' if not provided
  const selectType = type ?? 'single'

  const selectedLabel = $derived(items.find((item) => item.value === value)?.label)

  const mergedLabelProps = $derived(
    mergeProps(labelProps, {
      class: cn('mb-1.5 block text-sm font-medium text-zinc-700', labelProps?.class),
    }),
  )

  const mergedContentProps = $derived(
    mergeProps(contentProps, {
      side: 'bottom',
      align: 'start',
      class: cn(
        'z-50 min-w-[var(--bits-select-trigger-width)] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 shadow-lg',
        'dark:border-zinc-800 dark:bg-zinc-900',
        contentProps?.class,
      ),
    }),
  )
</script>

<!--
TypeScript Discriminated Unions + destructing (required for "bindable") do not
get along, so we shut typescript up by casting `value` to `never`, however,
from the perspective of the consumer of this component, it will be typed appropriately.
-->
{#if label}
  <Label.Root for={id} bind:ref={labelRef} {...mergedLabelProps}>
    {label}
  </Label.Root>
{/if}

<Select.Root bind:value={value as never} type={selectType as any} {...restProps}>
  <Select.Trigger
    {id}
    class={cn(
      'flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-zinc-900/20 bg-transparent px-3 py-1 text-sm transition-colors',
      'text-zinc-700 placeholder:text-zinc-500',
      'focus-visible:border-zinc-900/40 focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'dark:border-white/15 dark:bg-white/5 dark:text-zinc-300',
      'dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20',
      'data-placeholder:text-zinc-500 dark:data-placeholder:text-zinc-500',
      triggerProps?.class,
    )}
  >
    {selectedLabel ? selectedLabel : placeholder}
    <svg
      class="ml-2 size-4 shrink-0 text-zinc-500 transition-transform data-[state=open]:rotate-180"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4 4 4-4" />
    </svg>
  </Select.Trigger>
  <Select.Portal>
    <Select.Content {...mergedContentProps}>
      <Select.ScrollUpButton
        class="flex items-center justify-center py-1 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <svg
          class="size-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </Select.ScrollUpButton>
      <Select.Viewport class="p-1">
        {#each items as { value, label, disabled } (value)}
          <Select.Item
            {value}
            {label}
            {disabled}
            class={cn(
              'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none',
              'text-zinc-700 hover:bg-zinc-100',
              'focus:bg-zinc-100',
              'data-highlighted:bg-zinc-100',
              'data-disabled:pointer-events-none data-disabled:opacity-50',
              'dark:text-zinc-300 dark:hover:bg-zinc-800',
              'dark:focus:bg-zinc-800',
              'dark:data-highlighted:bg-zinc-800',
            )}
          >
            {#snippet children({ selected })}
              <span class="flex-1">{label}</span>
              {#if selected}
                <svg
                  class="ml-2 size-4 text-emerald-600 dark:text-emerald-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
      <Select.ScrollDownButton
        class="flex items-center justify-center py-1 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <svg
          class="size-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </Select.ScrollDownButton>
    </Select.Content>
  </Select.Portal>
</Select.Root>
