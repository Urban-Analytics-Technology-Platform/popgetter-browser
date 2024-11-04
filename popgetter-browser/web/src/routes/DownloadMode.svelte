<script lang="ts">
  import type { FeatureCollection } from "geojson";
  import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
  import { mode } from "./globals";
  import Search from "../lib/search.svelte";
  import SearchParams from "./SearchParams.svelte";
  import { writable } from "svelte/store";
  import { GeoJSON, FillLayer, LineLayer } from "svelte-maplibre";

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

  async function getMetrics(sqlString: string): Promise<any> {
    if (sqlString.length > 0) {
      let data = await fetch(`/api/download?metrics=${sqlString}`)
        .then((r) => r.json())
        .then((data) => {
          console.log("Got result ", data);
          return data;
        });
    }
    return data;
  }

  // async function download(dataRequestSpec): Promise<Array<Map<any, any>>> {
  async function download(dataRequestSpec): Promise<any> {
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    try {
      // TODO: consider implementing client side join version of dowload
      // let metricsSql: string =
      //   await $rustBackend!.downloadDataRequestMetrics(dataRequestSpec);
      // TODO: make the metrics and geoms run concurrently
      // const metrics = await getMetrics(metricsSql);
      // const geoms =
      //   await $rustBackend!.downloadDataRequestGeoms(dataRequestSpec);

      // TODO: add client side join here
      // https://svelte-maplibre.vercel.app/examples/data_join

      // console.log(metrics);
      // console.log(geoms);

      // TODO: initial join impl on arrays
      // const metricsAndGeoms = metrics.map((item1) => ({
      //   ...metrics,
      //   ...geoms.get(item1.GEO_ID),
      // }));
      // console.log(metricsAndGeoms);

      // Download directly with backend without range requests as not impl for wasm
      console.log(dataRequestSpec);
      let metricsAndGeoms =
        await $rustBackend!.downloadDataRequest(dataRequestSpec);
      console.log(metricsAndGeoms);
      return metricsAndGeoms;
    } catch (err) {
      window.alert(`Failed to download: ${err}`);
    }
  }

  // For search input
  let searchTerm = "";

  // For search input
  let searchParams = {};

  // For search results
  let data: Array<Map<any, any>> = [];

  // For downloaded geojson
  let gj: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

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

  async function handleClick() {
    // TODO: replace example data request spec with one derived from a component
    let dataRequestSpec = {
      region: [{ BoundingBox: [-74.251785, 40.647043, -73.673286, 40.91014] }],
      metrics: [
        { MetricId: "f29c1976" },
        { MetricId: "079f3ba3" },
        { MetricId: "81cae95d" },
        { MetricText: "Key: uniqueID, Value: B01001_001;" },
      ],
      years: ["2021"],
      geometry: {
        geometry_level: "tract",
        include_geoms: true,
      },
    };
    // data = await download(dataRequestSpec);
    gj = await download(dataRequestSpec);
    console.log(gj);
  }
</script>

<SplitComponent>
  <div slot="sidebar">
    <button on:click={() => ($mode = { kind: "title" })}>Return to title</button
    >
    <!-- Search -->
    <section id="query-section">
      <Search bind:searchTerm on:input={handleInput} />
    </section>

    <SearchParams></SearchParams>

    <!-- Example download for testing -->
    <button on:click={() => handleClick()}>Example download</button>

    <!-- TODO: convert table for search results into component -->
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

  <!-- Map previews downloaded metrics -->
  <div slot="map">
    <GeoJSON data={gj}>
      <FillLayer
        paint={{
          "fill-color": [
            "interpolate",
            ["linear"],
            // Population
            ["get", "B01001_E001"],
            0,
            "#0a0",
            10000,
            "#a00",
          ],
          "fill-opacity": 0.5,
        }}
      />
      <LineLayer paint={{ "line-color": "black", "line-width": 1 }} />
    </GeoJSON>
  </div>
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
