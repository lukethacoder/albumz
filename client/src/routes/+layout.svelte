<script lang="ts">
  import { page } from '$app/state'
  import { locales, localizeHref } from '$lib/paraglide/runtime'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import './layout.css'
  import favicon from '$lib/assets/favicon.svg'
  import { Button, ImportStatus } from '$lib/components'
  import { Plus, LogOut, User } from '@lucide/svelte'
  import { authStore } from '$lib/stores/auth.svelte'
  import { importStore } from '$lib/stores/import.svelte'
  import { m } from '$lib/paraglide/messages'
  import { resolve } from '$app/paths'
  import { Tooltip } from '$lib/components/tooltip'

  let { children } = $props()

  onMount(() => {
    // Restore session on app load
    authStore.restoreSession()
    // Resume any in-progress import jobs from a previous session
    importStore.restore()
  })

  function handleLogout() {
    authStore.clearAuth()
    goto(resolve('/auth/login'))
  }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="flex items-center justify-between p-3">
  <a href="/" class="font-funnel text-xl font-bold uppercase hover:underline dark:text-emerald-400"
    >albumz</a
  >

  <div class="flex items-center gap-2">
    {#if authStore.isAuthenticated}
      <Button.Root variant="outline" href="/add">
        {m.add_album()}
        {#snippet iconLeft()}
          <Plus />
        {/snippet}
      </Button.Root>

      <Button.Root variant="ghost" href="/profile" class="capitalize">
        {#snippet iconLeft()}
          <User />
        {/snippet}
      </Button.Root>

      <Button.Root variant="outline" class="capitalize" onclick={handleLogout}>
        {m.logout()}
        {#snippet iconLeft()}
          <LogOut />
        {/snippet}
      </Button.Root>
    {:else}
      <Button.Root variant="outline" href="/auth/login" class="capitalize"
        >{m.sign_in()}</Button.Root
      >
    {/if}
  </div>
</nav>

<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>

<ImportStatus.Root />

<div style="display:none">
  {#each locales as locale (locale)}
    <a href={localizeHref(page.url.pathname, { locale })} class="dark:text-white">{locale}</a>
  {/each}
</div>
