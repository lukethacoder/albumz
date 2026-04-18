<script lang="ts">
  import { Tooltip } from 'bits-ui'
  import { type RootProps } from './types'

  let {
    open = $bindable(false),
    children,
    trigger,
    triggerProps = {},
    ...restProps
  }: RootProps = $props()
</script>

<Tooltip.Root bind:open {...restProps}>
  <Tooltip.Trigger {...triggerProps}>
    {@render trigger()}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content
      class="animate-in fade-in-0 zoom-in-95 z-50 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 shadow-md ring-1 ring-white/10"
    >
      {@render children()}
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
