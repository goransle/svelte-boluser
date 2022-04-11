<script lang="ts">
  import { API_KEY, API_URL } from "./stores";

  let IUs = 1;
  let insulin = "Novorapid";

  async function sendRequest() {
    const req = new Request(
      [$API_URL, "/api/v1/", "treatments.json"].join(""),
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          insulin: IUs,
          units: 'IU',
          eventType: "Meal bolus",
          entered_by: "boluser",
        }),
      }
    );
    const response = await fetch(req);

    const json = await response.json();
    console.log(response, json);
  }
</script>

<main>
  <input type="number" bind:value={IUs} />
  <input on:click={sendRequest} type="submit" />
</main>
