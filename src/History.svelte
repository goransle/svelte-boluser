<script lang="ts">
  import { API_URL } from "./stores";
  import { onMount } from "svelte";

  onMount(() => {
    const interval = setInterval(getTreatments, 5000);
    return () => clearInterval(interval);
  });

  async function getTreatments() {
    const req = new Request(
      [$API_URL, "/api/v1/", "treatments?count=3&find[insulin][$gte]=0"].join(
        ""
      )
    );
    const response = await fetch(req);
    data = await response.json();
  }

  let data;
</script>

<main>
  {#if data}
    <table>
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
  {/if}
</main>
