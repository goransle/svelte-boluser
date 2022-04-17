<script lang="ts">
    export let handleClick: ()=>void;
</script>

<button on:click={handleClick} class="w-16 border-solid border-2 border-sky-500 p-2 bg-slate-100 rounded">
    <slot/>
</button>