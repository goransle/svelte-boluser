<script lang="ts">
import Bolus from './Bolus.svelte';

	import Config from './Config.svelte';
	export let isConfiguring = false;
</script>

<main>
	{#if isConfiguring}
		<Config />
	{/if}
	<button id="configButton" on:click={()=>{isConfiguring = !isConfiguring}}>Config</button>
	<Bolus />
</main>

<style>
	main {
		padding: 1em;
		margin: 0 auto;
	}
</style>