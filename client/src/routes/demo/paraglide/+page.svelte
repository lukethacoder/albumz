<script lang="ts">
  import { setLocale } from '$lib/paraglide/runtime'
  import { m } from '$lib/paraglide/messages.js'
</script>

<h1>{m.hello_world({ name: 'SvelteKit User', country: 'Australia' })}</h1>

<div>
  <button
    class="m-0 cursor-pointer border px-4 py-1 hover:bg-blue-300"
    onclick={() => setLocale('en')}>en</button
  >
  <button
    class="m-0 cursor-pointer border px-4 py-1 hover:bg-blue-300"
    onclick={() => setLocale('nl')}>nl</button
  >
</div>

<p>
  If you use VSCode, install the

  <a
    href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension"
    target="_blank">Sherlock i18n extension</a
  >

  for a better i18n experience.
</p>
