import type { Button } from 'bits-ui'
import type { Snippet } from 'svelte'

export type Theme = 'brand' | 'positive' | 'negative' | 'warning' | 'neutral'
export type Variant = 'solid' | 'outline' | 'ghost'
export type Size = 'sm' | 'md' | 'lg'

export type RootProps = Button.RootProps & {
  theme?: Theme
  variant?: Variant
  size?: Size
  iconLeft?: Snippet
  iconRight?: Snippet
  loading?: boolean
}
