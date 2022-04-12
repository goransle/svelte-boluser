<script lang="ts">
  import { API_KEY, API_URL } from "./stores";

  let IUs = 1;
  let insulin = "Novorapid";
  let step = 0.5;

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
          units: "IU",
          eventType: "Meal bolus",
          entered_by: "boluser",
        }),
      }
    );
    const response = await fetch(req);

    const json = await response.json();
  }
</script>

<main>
  <div id="input">
    <button
      on:click={() => {
        IUs -= 0.5;
      }}>-½</button
    >
    <button
      on:click={() => {
        IUs -= 1;
      }}>-1</button
    >
    <input type="number" bind:value={IUs} {step} />
    <button
      on:click={() => {
        IUs += 0.5;
      }}>+½</button
    >
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
  <input on:click={sendRequest} type="submit" value="Submit" />
</main>

<style>
  main{
    width: 100%;
  }
  div {
    margin: 1em 0;
  }
  #singles {
      display:flex;
  }
  #singles button {
    width: 100px;
    height: 80px;
  }
   #input {
    display:flex;
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
