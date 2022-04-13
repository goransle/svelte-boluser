<script lang="ts">
  import { API_URL } from "./stores";
  import { onMount } from "svelte";
  import { Jumper } from 'svelte-loading-spinners'

  onMount(() => {
    getTreatments().then(()=>{
      const interval = setInterval(getTreatments, 5000);
      return () => clearInterval(interval);
    })
  });

  async function getTreatments() {
    isLoading = true;
    const req = new Request(
      [$API_URL, "/api/v1/", "treatments?count=3&find[insulin][$gte]=0"]
        .join("")
    );
    const response = await fetch(req);
    data = await response.json();
    setTimeout(() => {
      isLoading = false;
    }, 1000);
  }

  let data;
  let isLoading = true;

</script>

<main>
  {#if !data && isLoading}
    <Jumper></Jumper>
  {/if}
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
