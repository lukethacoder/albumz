import type { Checkbox, Label } from 'bits-ui'
import type { WithoutChildrenOrChild } from '$lib/utils'

export type RootProps = WithoutChildrenOrChild<Checkbox.RootProps> & {
  label?: string
  labelRef?: HTMLLabelElement | null
  labelProps?: WithoutChildrenOrChild<Label.RootProps>
}
