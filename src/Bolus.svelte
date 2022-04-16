<script lang="ts">
  import ky from "ky";
  import { API_KEY, API_URL } from "./stores";

  const eventTypes = ["Meal bolus", "Correction bolus", "Other"];

  let IUs = 1;
  let insulin = "Novorapid";
  let step = 0.5;
  let eventType = eventTypes[0];

  async function sendRequest() {
    const jsonBody = {
      insulin: IUs,
      units: "IU",
      eventType,
      entered_by: "boluser",
    };

    const response = await ky
      .post("api/v1/treatments.json", {
        json: jsonBody,
        prefixUrl: $API_URL
      })
      .json();

    console.log(response);
  }
</script>

<main>
  <div id="input">
    <button
      on:click={() => {
        IUs -= 1;
      }}
      >-1
    </button>
    {#if step === 0.5}
      <button
        on:click={() => {
          IUs -= 0.5;
        }}>-½</button
      >
    {/if}
    <input type="number" bind:value={IUs} {step} />
    {#if step === 0.5}
      <button
        on:click={() => {
          IUs += 0.5;
        }}>+½</button
      >
    {/if}
    <button
      on:click={() => {
        IUs += 1;
      }}>+1</button
    >
  </div>
  <div id="singles">
    {#each [0.5, 1, 1.5, 2, 3] as value}
      <button
        on:click={() => {
          IUs = value;
        }}>{value}</button
      >
    {/each}
  </div>
  <div>
    <select
      on:change={(e) => {
        eventType = e.currentTarget.value;
      }}
    >
      {#each eventTypes as eventOption}
        <option selected={eventOption === eventType} value={eventOption}
          >{eventOption}</option
        >
      {/each}
    </select>
  </div>
  <input on:click={sendRequest} type="submit" value="Submit" />
</main>

<style>
  main {
    width: 100%;
  }
  div {
    margin: 1em 0;
  }
  #singles {
    display: flex;
  }
  #singles button {
    width: 100px;
    height: 80px;
  }
  #input {
    display: flex;
    align-items: center;
    align-content: space-around;
    width: 100%;
    height: 8em;
  }
  #input button {
    width: 12em;
    height: 100%;
  }
  #input input {
    width: 3em;
  }
</style>
