import { Tooltip as BitsTooltip } from 'bits-ui'
import Root from './component.svelte'
import type { RootProps } from './types'

const Provider = BitsTooltip.Provider

export { Root, Provider }
export type { RootProps }

export const Tooltip = { Root, Provider }
