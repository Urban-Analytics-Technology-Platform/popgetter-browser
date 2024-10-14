<script lang="ts">
  import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
  import { mode } from "./globals";

  async function getCountries(): Promise<Array<Map<any, any>>> {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      const countries = await $rustBackend!.getCountries();
      console.log(countries);
      return countries;
    } catch (err) {
      window.alert(`Failed to get countries: ${err}`);
    }
  }

  let data: Array<Map<any, any>> = [];

  // Function to handle button click
  async function handleClick() {
    // Assign the result of `generateResult` to the `result` variable
    data = await getCountries();
  }

</script>

<SplitComponent>
  <div slot="sidebar">
    <!-- <SimpleComponent name="Stu" /> -->

    <button on:click={() => ($mode = { kind: "title" })}
      >Return to title</button
    >
    <!-- <button on:click={() => getCountries()}>Get popgetter countries</button> -->
    <button on:click={() => handleClick()}>Get countries</button>

    <table class="styled-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>ISO3</th>
          <th>ISO3166_2</th>
        </tr>
      </thead>
      <tbody>
        {#each data as record}
          <tr>
            <td>{record.country_name_short_en}</td>
            <td>{record.country_iso3}</td>
            <td>{record.country_iso3166_2}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div slot="map"></div>
</SplitComponent>

<!-- CSS Styling -->
<style>
  .styled-table {
    width: 100%;
    border-collapse: collapse;
    font-family: Arial, sans-serif;
    font-size: 16px;
    margin: 25px 0;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  }

  .styled-table thead tr {
    background-color: #009879;
    color: #ffffff;
    text-align: left;
    font-weight: bold;
  }

  .styled-table th,
  .styled-table td {
    padding: 12px 15px;
  }

  .styled-table tbody tr {
    border-bottom: 1px solid #dddddd;
  }

  .styled-table tbody tr:nth-of-type(even) {
    background-color: #f3f3f3;
  }

  .styled-table tbody tr:last-of-type {
    border-bottom: 2px solid #009879;
  }

  .styled-table tbody tr:hover {
    background-color: #f1f1f1;
  }
</style>
