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
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>