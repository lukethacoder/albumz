<script lang="ts">
  import { Dialog } from 'bits-ui'
  import type { RootProps } from './types'

  let {
    open = $bindable(false),
    children,
    buttonText,
    buttonSnippet,
    contentProps,
    title,
    description,
    ...restProps
  }: RootProps = $props()
</script>

<Dialog.Root bind:open {...restProps}>
  <Dialog.Trigger>
    {#if buttonSnippet}
      {@render buttonSnippet()}
    {:else if buttonText}
      {buttonText}
    {/if}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content {...contentProps}>
      <Dialog.Title>
        {@render title()}
      </Dialog.Title>
      <Dialog.Description>
        {@render description()}
      </Dialog.Description>
      {@render children?.()}
      <Dialog.Close>Close Dialog</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
