<script lang="ts">
  import { Combobox, Label, mergeProps, useId } from 'bits-ui'
  import { tick } from 'svelte'
  import { cn } from '$lib/utils'
  import type { RootProps } from './types'

  let {
    id = useId(),
    items = [],
    value = $bindable(),
    open = $bindable(false),
    inputProps,
    contentProps,
    type = 'single',
    labelRef = $bindable(null),
    label,
    labelProps,
    placeholder,
    ...restProps
  }: RootProps = $props()

  const isChip = $derived(type === 'multiple-chip')
  const bitsType = $derived(isChip ? 'multiple' : type) as 'single' | 'multiple'

  let searchValue = $state('')

  const filteredItems = $derived.by(() => {
    const selected = isChip ? ((value as string[] | undefined) ?? []) : []
    const base = isChip ? items.filter((item) => !selected.includes(item.value)) : items
    if (searchValue === '') return base
    return base.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()))
  })

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) searchValue = ''
  }

  async function handleValueChange() {
    // Wait a tick so Bits UI's toggleItem finishes writing the item label into inputValue first,
    // then we overwrite it back to empty.
    await tick()
    searchValue = ''
  }

  function removeChip(chipValue: string) {
    value = ((value as string[]) ?? []).filter((v) => v !== chipValue) as never
  }

  const mergedRootProps = $derived(
    mergeProps(restProps, { onOpenChange: handleOpenChange, onValueChange: handleValueChange }),
  )

  const baseInputClass = cn(
    'h-9 w-full rounded-md border border-zinc-900/20 bg-transparent pl-3 pr-10 py-1 text-sm text-zinc-700 transition-colors',
    'placeholder:text-zinc-500',
    'focus-visible:border-zinc-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'dark:border-white/15 dark:bg-white/5 dark:text-zinc-300',
    'dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20',
  )

  const mergedInputProps = $derived(
    mergeProps(inputProps, {
      id,
      placeholder,
      class: isChip
        ? cn(
            'min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500 border-none',
            inputProps?.class,
          )
        : cn(baseInputClass, inputProps?.class),
    }),
  )

  const mergedContentProps = $derived(
    mergeProps(contentProps, {
      side: 'bottom',
      align: 'start',
      class: cn(
        'z-50 w-full overflow-hidden rounded-md border border-zinc-200 bg-white p-1 shadow-lg',
        'dark:border-zinc-800 dark:bg-zinc-900 max-h-80 overflow-y-auto',
        contentProps?.class,
      ),
    }),
  )

  const mergedLabelProps = $derived(
    mergeProps(labelProps, {
      class: cn('mb-1.5 block text-sm font-medium text-zinc-700', labelProps?.class),
    }),
  )

  const selectedChips = $derived(isChip ? ((value as string[] | undefined) ?? []) : [])
</script>

<!--
  Destructuring (required for bindable) and discriminated unions don't play well together,
  so we cast the value to `never` to avoid type errors here. However, on the consumer
  side, the component will still be type-checked correctly.
-->

<Label.Root for={id} bind:ref={labelRef} {...mergedLabelProps}>
  {label}
</Label.Root>
<Combobox.Root
  type={bitsType}
  {items}
  bind:value={value as never}
  bind:open
  inputValue={searchValue}
  {...mergedRootProps}
>
  {#if isChip}
    <!-- Chip input variant: Combobox.Input renders as a child snippet so Bits UI owns
         the FloatingLayer anchor, focus/open/close, keyboard handling, and aria attrs,
         while we render our own element inside for chip layout. -->
    <Combobox.Input>
      {#snippet child({ props: bitsProps })}
        <div
          class={cn(
            'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-zinc-900/20 bg-transparent px-2 py-1.5 transition-colors',
            'focus-within:border-zinc-900/40 focus-within:ring-2 focus-within:ring-zinc-900/20',
            'dark:border-white/15 dark:bg-white/5',
            'dark:focus-within:border-white/30 dark:focus-within:ring-white/20',
          )}
        >
          {#each selectedChips as chip (chip)}
            <span
              class="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400"
            >
              {chip}
              <button
                type="button"
                onclick={() => removeChip(chip)}
                class="ml-0.5 cursor-pointer opacity-70 hover:opacity-100"
                aria-label="Remove {chip}"
              >
                <svg
                  class="size-2"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </span>
          {/each}
          <input
            {...bitsProps}
            value={searchValue}
            placeholder={selectedChips.length === 0 ? placeholder : undefined}
            onclick={() => (open = true)}
            oninput={(e) => {
              searchValue = e.currentTarget.value
              bitsProps.oninput?.(e)
            }}
            class={cn(
              'min-w-20 flex-1 border-none bg-transparent px-1 py-0 text-sm ring-0 outline-none placeholder:text-zinc-500',
              inputProps?.class,
            )}
          />
        </div>
      {/snippet}
    </Combobox.Input>
  {:else}
    <!-- Standard single/multiple variant -->
    <div class="relative">
      <Combobox.Input {...mergedInputProps} />
      <Combobox.Trigger
        class={cn(
          'absolute top-0 right-0 inline-flex h-full cursor-pointer items-center justify-center px-3 transition-colors',
          'text-zinc-500 hover:text-zinc-700',
          'focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          'dark:text-zinc-500 dark:hover:text-zinc-300',
        )}
      >
        <svg
          class="size-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4 4 4-4" />
        </svg>
      </Combobox.Trigger>
    </div>
  {/if}
  <Combobox.Portal>
    <Combobox.Content {...mergedContentProps}>
      {#each filteredItems as item, i (i + item.value)}
        <Combobox.Item
          {...item}
          class={cn(
            'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none',
            'text-zinc-700 hover:bg-zinc-100',
            'focus:bg-zinc-100',
            'data-highlighted:bg-zinc-100',
            'dark:text-zinc-300 dark:hover:bg-zinc-800',
            'dark:focus:bg-zinc-800',
            'dark:data-highlighted:bg-zinc-800',
          )}
        >
          {#snippet children({ selected })}
            <span class="flex-1">{item.label}</span>
            {#if selected}
              <svg
                class="size-4 text-emerald-600 dark:text-emerald-400"
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
        </Combobox.Item>
      {:else}
        <div class="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No results found
        </div>
      {/each}
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
