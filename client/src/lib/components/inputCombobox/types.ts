import { Combobox, Label } from 'bits-ui'
import type { WithoutChildrenOrChild } from '$lib/types'

export type RootProps = Combobox.RootProps & {
  inputProps?: WithoutChildrenOrChild<Combobox.InputProps>
  contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>
  id: string
  label: string
  labelRef?: HTMLLabelElement | null
  labelProps?: WithoutChildrenOrChild<Label.RootProps>
}
