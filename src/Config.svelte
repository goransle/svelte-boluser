<script lang="ts">
  import { API_URL, API_KEY } from "./stores";
  let verifySuccess = undefined;

  async function getAuthKey() {
    const req = new Request([$API_URL, "/api/v1/verifyAuth"].join(""), {
      method: "GET",
    });

    const response = await fetch(req);
    console.log(response);

    if (response.ok) {
      const json = await response.json();
      if (!json?.message?.canWrite) {
        verifySuccess = false;
      }
      console.log(json);
    }
  }
</script>

<main>
  <input bind:value={$API_URL} placeholder="API URL" />
  <input bind:value={$API_KEY} placeholder="API secret" />
  <button on:click={getAuthKey}>Verify</button>
  {#if verifySuccess !== undefined && !verifySuccess}
    <p>:(</p>
  {/if}
</main>
