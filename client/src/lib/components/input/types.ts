import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements'
import type { Label } from 'bits-ui'
import type { WithoutChildrenOrChild } from '$lib/types'

type InputType = Exclude<HTMLInputTypeAttribute, 'file'>

export type RootProps = WithElementRef<
  Omit<HTMLInputAttributes, 'type'> &
    ({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined }) & {
      id?: string
      label?: string
      labelRef?: HTMLLabelElement | null
      labelProps?: WithoutChildrenOrChild<Label.RootProps>
    }
>
