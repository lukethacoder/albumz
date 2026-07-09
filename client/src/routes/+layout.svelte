<script lang="ts">
  import { page } from '$app/state'
  import { locales, localizeHref } from '$lib/paraglide/runtime'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import './layout.css'
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

<svelte:head>
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content="albumz" />
  <link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<nav class="flex items-center justify-between p-3">
  <a
    href={resolve('/')}
    class="font-funnel text-xl font-bold uppercase hover:underline dark:text-emerald-400">albumz</a
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
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a href={localizeHref(page.url.pathname, { locale })} class="dark:text-white">{locale}</a>
  {/each}
</div>
