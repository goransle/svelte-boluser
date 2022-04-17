<script lang="ts">
  import Bolus from "./Bolus.svelte";

  import Config from "./Config.svelte";
  import History from "./History.svelte";
  export let isConfiguring = false;
</script>

<main class="container mx-auto">
  {#if isConfiguring}
    <Config />
  {/if}
  <button
    id="configButton"
    on:click={() => {
      isConfiguring = !isConfiguring;
    }}>Config</button
  >
  <History />
  <Bolus />
</main>
