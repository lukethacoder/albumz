import { Select, Label } from 'bits-ui'
import type { WithoutChildren } from '$lib/types'

export type RootProps = WithoutChildren<Select.RootProps> & {
  id?: string
  label?: string
  labelRef?: HTMLLabelElement | null
  labelProps?: WithoutChildren<Label.RootProps>
  placeholder?: string
  items: { value: string; label: string; disabled?: boolean }[]
  contentProps?: WithoutChildren<Select.ContentProps>
  triggerProps?: WithoutChildren<Select.TriggerProps>
}
