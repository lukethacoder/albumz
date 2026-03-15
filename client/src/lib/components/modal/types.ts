import type { WithoutChild } from '$lib/types'
import type { Dialog } from 'bits-ui'
import type { Snippet } from 'svelte'

export type RootProps = Dialog.RootProps & {
  title: Snippet
  description: Snippet
  contentProps?: WithoutChild<Dialog.ContentProps>
} & ({ buttonText: string; buttonSnippet?: never } | { buttonSnippet: Snippet; buttonText?: never })
