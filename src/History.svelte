<script lang="ts">
  import { onMount } from "svelte";
  import ky from 'ky';
  import { CONFIG } from "./stores";

  const {API_URL} = $CONFIG;

  onMount(() => {
    getTreatments().then(()=>{
      const interval = setInterval(getTreatments, 5000);
      return () => clearInterval(interval);
    })
  });

  async function getTreatments() {
    isLoading = true;
    const searchParams = new URLSearchParams({
      count: '3',
      'find[insulin][$gte]': '0'
    });

    data = await ky.get(
      "api/v1/treatments",{
          prefixUrl: API_URL,
          searchParams,
          cache: 'no-cache'
        }
    ).json();

    setTimeout(() => {
      isLoading = false;
    }, 1000);
  }

  let data;
  let isLoading = true;

</script>

<main>
  {#if data}
  <div style="display:inline-flex;">
    <table class:loading="{isLoading}">
      <thead>
        <tr>
          <th> Date </th>
          <th> Type </th>
          <th> Dose </th>
        </tr>
      </thead>
      <tbody>
        {#each data as treatment}
          <tr>
            <td>{new Date(treatment.created_at).toLocaleString()}</td>
            <td>{treatment.eventType}</td>
            <td>{treatment.insulin}</td>
          </tr>
        {/each}
      </tbody>
    </table>
      <button on:click={getTreatments} alt="Reload data">🔄</button>
      </div>
  {/if}
</main>
<style>
  table.loading {
    border: 1px dotted black;
  }
  th {
    text-align: left;
  }
</style>
