<script lang="ts">
  import type { FeatureCollection } from "geojson";
  import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import {
    rustBackend,
    rustIsLoaded,
    selectedCountry,
    selectedLevel,
  } from "./globals";
  import { mode } from "./globals";
  import Search from "../lib/search.svelte";
  import SearchParams from "./SearchParams.svelte";
  import { writable } from "svelte/store";
  import { GeoJSON, FillLayer, LineLayer } from "svelte-maplibre";
  import {
    Button,
    Checkbox,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";

  function add(s: string) {
    // TODO
    console.log(s);
    return;
  }

  function remove(s: string) {
    // TODO
    console.log(s);
    return;
  }

  async function search(x, offset): Promise<Array<Map<any, any>>> {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      const searchResults = await $rustBackend!.search(x, offset);
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
  let items: Array<Map<any, any>> = [];

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
          config: { match_type: "Regex", case_sensitivity: "Insensitive" },
        },
      ],
      geometry_level: {
        value: $selectedLevel,
        config: { match_type: "Exact", case_sensitivity: "Insensitive" },
      },
      year_range: [],
      country: {
        value: $selectedCountry,
        config: { match_type: "Regex", case_sensitivity: "Insensitive" },
      },
      region_spec: [],
    };
    console.log(searchParams);
    // TODO: update once pagination implemnted
    data = await search(searchParams, 0);
    items = data.slice(0, 10);
    console.log(data);
  }

  async function handleClick() {
    // TODO: replace example data request spec with one derived from a component
    let dataRequestSpec = {
      region: [{ BoundingBox: [-74.251785, 40.647043, -73.673286, 40.91014] }],
      metrics: [
        { MetricId: { id: "f29c1976" } },
        { MetricId: { id: "079f3ba3" } },
        { MetricId: { id: "81cae95d" } },
        { MetricText: "Key: uniqueID, Value: B01001_001;" },
      ],
      years: ["2021"],
      geometry: {
        geometry_level: "tract",
        include_geoms: true,
      },
    };
    gj = await download(dataRequestSpec);
    console.log(gj);
  }
</script>

<SplitComponent>
  <div slot="sidebar">
    <!-- <button on:click={() => ($mode = { kind: "title" })}>Return to title</button
    > -->
    <Button on:click={() => ($mode = { kind: "title" })}>Back to title</Button>
    <!-- Search -->
    <section id="query-section">
      <Search bind:searchTerm on:input={handleInput} />
    </section>

    <!-- TODO: convert table for search results into component -->
    <section id="<results-table">
      <Table>
        <TableHead>
          <!-- <TableHeadCell class="!p-4">
            <Checkbox />
          </TableHeadCell> -->
          <TableHeadCell>ID</TableHeadCell>
          <TableHeadCell>Name</TableHeadCell>
          <TableHeadCell>Year</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
          {#each items as item}
            <TableBodyRow>
              <TableBodyCell>{item.metric_id.slice(0, 8)}</TableBodyCell>
              <TableBodyCell>{item.metric_human_readable_name}</TableBodyCell>
              <TableBodyCell
                >{item.source_data_release_collection_period_start.slice(
                  0,
                  4,
                )}</TableBodyCell
              >
              <TableBodyCell>
                <Button on:click={() => add(item.metric_id)}>Add</Button>
                <Button on:click={() => remove(item.metric_id)}>Remove</Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </section>

    <!-- Example download for testing -->
    <button on:click={() => handleClick()}>Example download</button>
  </div>

  <!-- Map previews downloaded metrics -->
  <div slot="map">
    <GeoJSON data={gj}>
      <FillLayer
        paint={{
          "fill-color": [
            "interpolate",
            ["linear"],
            // TODO: update to respond to selection
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
  </div></SplitComponent
>
