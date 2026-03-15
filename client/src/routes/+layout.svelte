<script lang="ts">
  import { page } from '$app/state'
  import { locales, localizeHref } from '$lib/paraglide/runtime'
  import './layout.css'
  import favicon from '$lib/assets/favicon.svg'
  import { Button } from '$lib/components'
  import { Plus } from '@lucide/svelte'

  let { children } = $props()

  function handleAddAlbum() {
    // TODO: add new album modal/wizard
  }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="flex justify-between p-3">
  <a href="/" class="hover:underline dark:text-emerald-400">albumz</a>
  <Button.Root variant="outline" onclick={handleAddAlbum}>
    add album
    {#snippet iconLeft()}
      <Plus />
    {/snippet}
  </Button.Root>
</nav>

{@render children()}

<div style="display:none">
  {#each locales as locale (locale)}
    <a href={localizeHref(page.url.pathname, { locale })} class="dark:text-white">{locale}</a>
  {/each}
</div>
