<script lang="ts">
  import ky from "ky";
import Button from './Button.svelte';
  import { CONFIG } from "./stores";

  const {API_URL} = $CONFIG;

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
        prefixUrl: API_URL
      })
      .json();

    console.log(response);
  }
</script>

<div class="column mx-auto">
  <div>
    <Button
      handleClick={() => {
        IUs -= 1;
      }}
      >-1
    </Button>
    {#if step === 0.5}
      <Button
        handleClick={() => {
          IUs -= 0.5;
        }}>-½</Button
      >
    {/if}
    <input class="w-10" type="number" bind:value={IUs} {step} />
    {#if step === 0.5}
      <Button
        handleClick={() => {
          IUs += 0.5;
        }}>+½</Button
      >
    {/if}
    <Button
      handleClick={() => {
        IUs += 1;
      }}>+1</Button
    >
  </div>
  <div>
    {#each [0.5, 1, 1.5, 2, 3] as value}
      <Button
        handleClick={() => {
          IUs = value;
        }}>{value}</Button
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
  <input class="border-2 border-solid border-black p-2" on:click={sendRequest} type="submit" value="Submit" />
</div>

<style>
  div{
    @apply py-7;
  }
</style>