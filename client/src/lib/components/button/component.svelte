<script lang="ts">
  import { cn } from '$lib/utils'
  import { Button as BitsButton } from 'bits-ui'
  import type { ButtonRootProps } from './types'

  let { ref = $bindable(null), children, ...rest }: ButtonRootProps = $props()
</script>

<BitsButton.Root
  bind:ref
  {...rest}
  class={cn(
    'inline-flex cursor-pointer justify-center gap-0.5 overflow-hidden rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-1 dark:ring-emerald-400/20 dark:ring-inset dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300 dark:hover:ring-emerald-300',
    rest?.class,
  )}
>
  {@render children?.()}
</BitsButton.Root>
