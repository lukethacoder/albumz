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
    <Tooltip.Content>
      <Tooltip.Arrow />
      {@render children()}
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
