import { Tooltip } from 'bits-ui'
import { type Snippet } from 'svelte'

export type RootProps = Omit<Tooltip.RootProps, 'children'> & {
  trigger: Snippet
  triggerProps?: Tooltip.TriggerProps
  children: Snippet
}
