<script lang="ts">
  import { cn } from '$lib/utils'
  import { Button as BitsButton } from 'bits-ui'
  import type { RootProps, Size, Theme, Variant } from './types'

  let {
    theme = 'brand',
    variant = 'solid',
    size = 'md',
    ref = $bindable(null),
    loading = false,
    disabled = false,
    iconLeft,
    iconRight,
    children,
    ...rest
  }: RootProps = $props()

  // Resolve 'positive' as an alias for 'brand'
  let resolvedTheme: Theme = $derived(theme === 'positive' ? 'brand' : theme)

  // ─── Size ────────────────────────────────────────────────────────────────────
  const sizeClasses: Record<Size, string> = {
    sm: 'px-2.5 py-0.5 text-xs  gap-0.5',
    md: 'px-3   py-1   text-sm  gap-0.5',
    lg: 'px-4   py-1.5 text-sm  gap-1',
  }

  const iconSizeClasses: Record<Size, string> = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5',
  }

  // ─── Solid ───────────────────────────────────────────────────────────────────
  // Opaque fill in both light and dark — no transparency tricks.
  type CoreTheme = 'brand' | 'positive' | 'negative' | 'warning' | 'neutral'

  const solidClasses: Record<CoreTheme, string> = {
    brand:
      'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400',
    positive:
      'bg-green-600   text-white hover:bg-green-500   dark:bg-green-500   dark:hover:bg-green-400',
    negative:
      'bg-red-600     text-white hover:bg-red-500     dark:bg-red-500     dark:hover:bg-red-400',
    warning:
      'bg-amber-500   text-white hover:bg-amber-400   dark:bg-amber-400   dark:hover:bg-amber-300',
    neutral:
      'bg-zinc-900    text-white hover:bg-zinc-700    dark:bg-zinc-600    dark:hover:bg-zinc-500',
  }

  // ─── Outline ─────────────────────────────────────────────────────────────────
  const outlineClasses: Record<CoreTheme, string> = {
    brand:
      'bg-transparent text-emerald-700 ring-1 ring-inset ring-emerald-600/40 hover:bg-emerald-50 hover:ring-emerald-600 ' +
      'dark:bg-emerald-400/5 dark:text-emerald-400 dark:ring-1 dark:ring-inset dark:ring-emerald-400/30 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300 dark:hover:ring-emerald-300',
    positive:
      'bg-transparent text-green-700 ring-1 ring-inset ring-green-600/40 hover:bg-green-50 hover:ring-green-600 ' +
      'dark:bg-green-400/5 dark:text-green-400 dark:ring-1 dark:ring-inset dark:ring-green-400/30 dark:hover:bg-green-400/10 dark:hover:text-green-300 dark:hover:ring-green-300',
    negative:
      'bg-transparent text-red-700 ring-1 ring-inset ring-red-600/40 hover:bg-red-50 hover:ring-red-600 ' +
      'dark:bg-red-400/5 dark:text-red-400 dark:ring-1 dark:ring-inset dark:ring-red-400/30 dark:hover:bg-red-400/10 dark:hover:text-red-300 dark:hover:ring-red-300',
    warning:
      'bg-transparent text-amber-700 ring-1 ring-inset ring-amber-500/40 hover:bg-amber-50 hover:ring-amber-500 ' +
      'dark:bg-amber-400/5 dark:text-amber-400 dark:ring-1 dark:ring-inset dark:ring-amber-400/30 dark:hover:bg-amber-400/10 dark:hover:text-amber-300 dark:hover:ring-amber-300',
    neutral:
      'bg-transparent text-zinc-700 ring-1 ring-inset ring-zinc-900/20 hover:bg-zinc-50 hover:ring-zinc-900/40 ' +
      'dark:bg-white/5 dark:text-zinc-400 dark:ring-1 dark:ring-inset dark:ring-white/15 dark:hover:bg-white/10 dark:hover:text-zinc-300 dark:hover:ring-white/30',
  }

  // ─── Ghost ───────────────────────────────────────────────────────────────────
  const ghostClasses: Record<CoreTheme, string> = {
    brand:
      'bg-transparent text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300',
    positive:
      'bg-transparent text-green-700   hover:bg-green-50   dark:text-green-400   dark:hover:bg-green-400/10   dark:hover:text-green-300',
    negative:
      'bg-transparent text-red-700     hover:bg-red-50     dark:text-red-400     dark:hover:bg-red-400/10     dark:hover:text-red-300',
    warning:
      'bg-transparent text-amber-700   hover:bg-amber-50   dark:text-amber-400   dark:hover:bg-amber-400/10   dark:hover:text-amber-300',
    neutral:
      'bg-transparent text-zinc-600    hover:bg-zinc-100   dark:text-zinc-400    dark:hover:bg-white/5        dark:hover:text-zinc-300',
  }

  const variantMap: Record<Variant, Record<CoreTheme, string>> = {
    solid: solidClasses,
    outline: outlineClasses,
    ghost: ghostClasses,
  }

  let themeVariantClasses = $derived(variantMap[variant][resolvedTheme as CoreTheme])
  let isDisabled = $derived(disabled || loading)

  $effect(() => {
    console.log('rest ', rest)
  })
</script>

<!-- disabled={isDisabled} -->
<BitsButton.Root
  bind:ref
  {...rest}
  class={cn(
    // ── Base — preserves your exact structural choices ─────────────────────────
    'inline-flex cursor-pointer justify-center overflow-hidden rounded-full font-medium transition',
    // ── Focus ring ────────────────────────────────────────────────────────────
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900',
    // ── Disabled ──────────────────────────────────────────────────────────────
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
    // ── Press ─────────────────────────────────────────────────────────────────
    'active:scale-[0.97]',
    // ── Size ──────────────────────────────────────────────────────────────────
    sizeClasses[size],
    // ── Theme + Variant ───────────────────────────────────────────────────────
    themeVariantClasses,
    rest?.class,
  )}
>
  {#if loading}
    <svg
      class="{iconSizeClasses[size]} shrink-0 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  {:else if iconLeft}
    <span class="flex {iconSizeClasses[size]}">
      {@render iconLeft()}
    </span>
  {/if}

  {#if children}
    {@render children()}
  {/if}

  {#if iconRight && !loading}
    <span class="flex {iconSizeClasses[size]}">
      {@render iconRight()}
    </span>
  {/if}
</BitsButton.Root>
