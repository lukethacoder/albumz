import { Combobox, Label } from 'bits-ui'
import type { WithoutChildrenOrChild } from '$lib/types'

export type RootProps = Omit<Combobox.RootProps, 'type'> & {
  inputProps?: WithoutChildrenOrChild<Combobox.InputProps>
  contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>
  id: string
  label: string
  labelRef?: HTMLLabelElement | null
  labelProps?: WithoutChildrenOrChild<Label.RootProps>
  type?: 'single' | 'multiple' | 'multiple-chip'
  placeholder?: string
  allowNewValue?: boolean
}
