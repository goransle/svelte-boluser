<script lang="ts">
  import { CONFIG } from "./stores";

  let { API_URL, API_KEY } = $CONFIG;

  let verifySuccess = undefined;

  async function getAuthKey() {
    const req = new Request([API_URL, "/api/v1/verifyAuth"].join(""), {
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
  let timeout: ReturnType<typeof setTimeout> | number = 0;
  function updateValue(key, value) {
    clearTimeout(timeout as any);
    timeout = setTimeout(() => {
      CONFIG.set({
        ...$CONFIG,
        [key]: value,
      });
    }, 600);
  }
</script>

<main>
  <input
    bind:value={API_URL}
    on:change={(e) => {
      updateValue("API_URL", e.currentTarget.value);
    }}
    placeholder="API URL"
  />
  <input
    on:change={(e) => {
      updateValue("API_KEY", e.currentTarget.value);
    }}
    bind:value={API_KEY}
    placeholder="API secret"
  />
  <button on:click={getAuthKey}>Verify</button>
  {#if verifySuccess !== undefined && !verifySuccess}
    <p>:(</p>
  {/if}
</main>
