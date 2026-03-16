<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte'
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/auth/login')
		}
	})

	const user = $derived(authStore.user)
</script>

<svelte:head>
	<title>Profile - Albumz</title>
</svelte:head>

{#if user}
	<div class="mx-auto max-w-4xl p-6">
		<h1 class="mb-6 text-3xl font-bold">Profile</h1>

		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700">User ID</label>
					<p class="mt-1 text-sm text-gray-900">{user.id}</p>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700">Email</label>
					<p class="mt-1 text-sm text-gray-900">{user.email}</p>
				</div>

				{#if user.username}
					<div>
						<label class="block text-sm font-medium text-gray-700">Username</label>
						<p class="mt-1 text-sm text-gray-900">{user.username}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
