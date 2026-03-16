<script lang="ts">
  import { page } from '$app/state'
  import { locales, localizeHref } from '$lib/paraglide/runtime'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import './layout.css'
  import favicon from '$lib/assets/favicon.svg'
  import { Button } from '$lib/components'
  import { Plus, LogOut, User } from '@lucide/svelte'
  import { authStore } from '$lib/stores/auth.svelte'

  let { children } = $props()

  onMount(() => {
    // Restore session on app load
    authStore.restoreSession()
  })

  function handleAddAlbum() {
    // TODO: add new album modal/wizard
  }

  function handleLogout() {
    authStore.clearAuth()
    goto('/auth/login')
  }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<nav class="flex items-center justify-between p-3">
  <a href="/" class="font-funnel text-xl font-bold uppercase hover:underline dark:text-emerald-400"
    >albumz</a
  >

  <div class="flex items-center gap-2">
    {#if authStore.isAuthenticated}
      <Button.Root variant="outline" onclick={handleAddAlbum}>
        add album
        {#snippet iconLeft()}
          <Plus />
        {/snippet}
      </Button.Root>

      <Button.Root variant="ghost" href="/profile">
        {#snippet iconLeft()}
          <User />
        {/snippet}
        {authStore.user?.email}
      </Button.Root>

      <Button.Root variant="outline" onclick={handleLogout}>
        logout
        {#snippet iconLeft()}
          <LogOut />
        {/snippet}
      </Button.Root>
    {:else}
      <Button.Root variant="outline" href="/auth/login">sign in</Button.Root>
      <Button.Root variant="outline" href="/auth/register">sign up</Button.Root>
    {/if}
  </div>
</nav>

{@render children()}

<div style="display:none">
  {#each locales as locale (locale)}
    <a href={localizeHref(page.url.pathname, { locale })} class="dark:text-white">{locale}</a>
  {/each}
</div>
