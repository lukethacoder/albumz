<script lang="ts">
  let { data } = $props()
  const user = $derived(data.user)
</script>

<svelte:head>
  <title>Profile - Albumz</title>
</svelte:head>

{#if user}
  <div class="mx-auto max-w-4xl p-6">
    <h1 class="mb-6 text-3xl font-bold">Profile</h1>

    <div class="">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium">User ID</label>
          <p class="mt-1 text-sm">{user.id}</p>
        </div>

        <div>
          <label class="block text-sm font-medium">Email</label>
          <p class="mt-1 text-sm">{user.email}</p>
        </div>

        {#if user.username}
          <div>
            <label class="block text-sm font-medium">Username</label>
            <p class="mt-1 text-sm">{user.username}</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
