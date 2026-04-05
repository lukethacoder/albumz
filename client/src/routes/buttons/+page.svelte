<script lang="ts">
  import { Button, Input, InputCheckbox, InputCombobox, InputSelect } from '$lib/components'
  import { ChevronRight } from '@lucide/svelte'

  let saving = $state(false)

  function simulateSave() {
    saving = true
    setTimeout(() => (saving = false), 2000)
  }

  // Input states
  let textValue = $state('')
  let emailValue = $state('')
  let passwordValue = $state('')
  let disabledValue = $state('Cannot edit')
  let errorValue = $state('invalid@')
  let rangeValue = $state('50')

  // Checkbox states
  let checked = $state(false)
  let checkedDefault = $state(true)
  let indeterminate = $state(true)
  let checkedDisabled = $state(true)

  // Combobox states
  let singleValue = $state<string | undefined>(undefined)
  let multiValue = $state<string[]>([])

  // Select states
  let selectValue = $state<string | undefined>(undefined)

  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
  ]

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
  ]
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

  <hr class="border-zinc-200 dark:border-zinc-800" />

  <!-- Input component -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Input</h2>
    <div class="max-w-md space-y-4">
      <div>
        <Input.Root
          label="Text input"
          type="text"
          placeholder="Enter text..."
          bind:value={textValue}
        />
        {#if textValue}
          <p class="mt-1 text-xs text-zinc-500">Value: {textValue}</p>
        {/if}
      </div>

      <div>
        <Input.Root
          label="Email input"
          type="email"
          placeholder="you@example.com"
          bind:value={emailValue}
        />
      </div>

      <div>
        <Input.Root
          label="Password input"
          type="password"
          placeholder="••••••••"
          bind:value={passwordValue}
        />
      </div>

      <div>
        <Input.Root
          label="Disabled input"
          labelProps={{ class: 'text-zinc-400' }}
          type="text"
          disabled
          bind:value={disabledValue}
        />
      </div>

      <div>
        <Input.Root
          label="Invalid input"
          type="email"
          placeholder="Enter email"
          aria-invalid="true"
          bind:value={errorValue}
        />
        <p class="mt-1 text-xs text-red-600">Please enter a valid email address</p>
      </div>
    </div>
  </section>

  <!-- Input component type="range" -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
      Input (range)
    </h2>
    <div class="max-w-md space-y-4">
      <div>
        <Input.Root
          label="Volume (0-100)"
          type="range"
          min="0"
          max="100"
          step="1"
          bind:value={rangeValue}
        />
        <p class="mt-1 text-xs text-zinc-500">Value: {rangeValue}</p>
      </div>
    </div>
  </section>

  <hr class="border-zinc-200 dark:border-zinc-800" />

  <!-- Checkbox component -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Checkbox</h2>
    <div class="space-y-4">
      <InputCheckbox.Root
        bind:checked
        label={`Unchecked by default ${checked ? 'checked' : 'unchecked'}`}
      />

      <InputCheckbox.Root bind:checked={checkedDefault} label="Checked by default" />

      <InputCheckbox.Root bind:indeterminate label="Indeterminate state" />

      <InputCheckbox.Root
        bind:checked={checkedDisabled}
        disabled
        label="Disabled (checked)"
        labelProps={{ class: 'text-zinc-400' }}
      />

      <InputCheckbox.Root
        disabled
        label="Disabled (unchecked)"
        labelProps={{ class: 'text-zinc-400' }}
      />
    </div>
  </section>

  <hr class="border-zinc-200 dark:border-zinc-800" />

  <!-- Combobox component -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Combobox</h2>
    <div class="max-w-xs space-y-4">
      <div>
        <InputCombobox.Root
          type="single"
          items={fruits}
          bind:value={singleValue}
          label="Single select"
        />
        {#if singleValue}
          <p class="mt-1 text-xs text-zinc-500">Selected: {singleValue}</p>
        {/if}
      </div>

      <div>
        <InputCombobox.Root
          type="multiple"
          items={fruits}
          bind:value={multiValue}
          label="Multiple select"
        />
        {#if multiValue.length > 0}
          <p class="mt-1 text-xs text-zinc-500">Selected: {multiValue.join(', ')}</p>
        {/if}
      </div>
    </div>
  </section>

  <hr class="border-zinc-200 dark:border-zinc-800" />

  <!-- Select component -->
  <section>
    <h2 class="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">Select</h2>
    <div class="max-w-xs space-y-4">
      <div>
        <InputSelect.Root
          label="Country"
          items={countries}
          bind:value={selectValue}
          placeholder="Select a country..."
        />
        {#if selectValue}
          <p class="mt-1 text-xs text-zinc-500">Selected: {selectValue}</p>
        {/if}
      </div>
    </div>
  </section>
</div>
