<script lang="ts">
  import { Button } from '$lib/components'
  import { ChevronRight } from '@lucide/svelte'

  let saving = $state(false)

  function simulateSave() {
    saving = true
    setTimeout(() => (saving = false), 2000)
  }
</script>

<div class="max-w-4xl space-y-10 p-10">
  <!-- Themes × Variants matrix -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
      Themes × Variants
    </h2>
    <div class="overflow-x-auto">
      <table class="text-sm">
        <thead>
          <tr class="text-xs tracking-wider text-zinc-400 uppercase">
            <th class="py-2 pr-8 text-left font-medium">Theme</th>
            {#each ['solid', 'outline', 'ghost'] as variant}
              <th class="px-6 py-2 font-medium">{variant}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each ['brand', 'positive', 'negative', 'warning', 'neutral'] as theme}
            <tr>
              <td class="py-2.5 pr-8 font-medium text-zinc-500 capitalize">{theme}</td>
              {#each ['solid', 'outline', 'ghost'] as variant}
                <td class="px-6 py-2.5 text-center">
                  <Button.Root {theme} {variant} size="sm">{theme}</Button.Root>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <hr class="border-zinc-200 dark:border-zinc-800" />

  <!-- primary alias -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Brand alias</h2>
    <div class="flex flex-wrap items-center gap-3">
      <Button.Root theme="brand" variant="solid">brand/solid</Button.Root>
      <Button.Root theme="brand" variant="outline">brand/outline</Button.Root>
      <Button.Root theme="brand" variant="ghost">brand/ghost</Button.Root>
    </div>
  </section>

  <hr class="border-zinc-200 dark:border-zinc-800" />
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Sizes</h2>
    <div class="flex flex-wrap items-center gap-3">
      <Button.Root theme="brand" variant="solid" size="sm">Small</Button.Root>
      <Button.Root theme="brand" variant="solid" size="md">Medium</Button.Root>
      <Button.Root theme="brand" variant="solid" size="lg">Large</Button.Root>
    </div>
  </section>

  <hr class="border-zinc-200 dark:border-zinc-800" />

  <!-- States & compositions -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">States</h2>
    <div class="flex flex-wrap items-center gap-3">
      <!-- Loading -->
      <Button.Root theme="brand" variant="solid" loading={saving} onclick={simulateSave}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button.Root>

      <!-- Disabled -->
      <Button.Root theme="negative" variant="solid" disabled>Disabled</Button.Root>

      <!-- Icon left -->
      <Button.Root theme="positive" variant="outline">
        {#snippet iconLeft()}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,8 7,12 13,4" />
          </svg>
        {/snippet}
        Confirm
      </Button.Root>

      <!-- Icon right -->
      <Button.Root theme="brand" variant="ghost">
        Learn more
        {#snippet iconRight()}
          <ChevronRight />
        {/snippet}
      </Button.Root>
    </div>
  </section>

  <hr class="border-zinc-200 dark:border-zinc-800" />

  <!-- Real-world pairings -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
      Common pairings
    </h2>
    <div class="flex flex-wrap gap-4">
      <div class="flex gap-2">
        <Button.Root theme="neutral" variant="outline">Cancel</Button.Root>
        <Button.Root theme="brand" variant="solid">Submit</Button.Root>
      </div>

      <div class="flex gap-2">
        <Button.Root theme="neutral" variant="ghost">Go back</Button.Root>
        <Button.Root theme="negative" variant="solid">Delete account</Button.Root>
      </div>
    </div>
  </section>
</div>
