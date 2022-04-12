<script lang="ts">
  import Bolus from "./Bolus.svelte";

  import Config from "./Config.svelte";
  import History from "./History.svelte";
  export let isConfiguring = false;
</script>

<main>
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

<style>
  main {
    padding: 1em;
    margin: 0 auto;
  }
</style>
