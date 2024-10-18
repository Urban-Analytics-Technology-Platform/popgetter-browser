<script lang="ts">
  import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
  import { mode } from "./globals";
  import Search from "../lib/search.svelte";
  import SearchParams from "./SearchParams.svelte";

  async function search(x, offset): Promise<Array<Map<any, any>>> {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      const searchResults = await $rustBackend!.search(x, offset);
      // console.log(searchResults);
      return searchResults;
    } catch (err) {
      window.alert(`Failed to search: ${err}`);
    }
  }

  // For search input
  let searchTerm = "";

  // For search input
  let searchParams = {};

  // For search results
  let data: Array<Map<any, any>> = [];

  // Function to handle button click
  async function handleInput() {
    // Assign the result of `generateResult` to the `result` variable
    // TODO: update example when additional search fields enabled for input
    searchParams = {
      metric_id: [],
      text: [
        {
          text: searchTerm,
          context: ["Hxl", "HumanReadableName", "Description"],
        },
      ],
      geometry_level: "tract",
      year_range: [{ Between: [2021, 2021] }],
      country: "USA",
      region_spec: [
        { BoundingBox: [-74.251785, 40.647043, -73.673286, 40.91014] },
      ],
    };

    // TODO: update once pagination implemnted
    data = await search(searchParams, 0);
  }
</script>

<SplitComponent>
  <div slot="sidebar">
    <!-- <SimpleComponent name="Stu" /> -->

    <button on:click={() => ($mode = { kind: "title" })}>Return to title</button
    >

    <section id="query-section">
      <Search bind:searchTerm on:input={handleInput} />
    </section>

    <SearchParams></SearchParams>

    <!-- Example search text: -->
    <!-- Key: uniqueID, Value: B01001_001; -->

    <table class="styled-table">
      <thead>
        <tr>
          <th>Metric ID</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {#each data.slice(0, 10) as record}
          <tr>
            <td>{record.metric_id.slice(0, 8)}</td>
            <td>{record.metric_human_readable_name}</td>
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
