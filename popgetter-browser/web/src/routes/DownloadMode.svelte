<script lang="ts">
  import type { FeatureCollection } from "geojson";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import {
    map,
    previewedMetricsList,
    previewMetricMap,
    rustBackend,
    selectedCountry,
    selectedLevel,
    selectedMetricsList,
    tileUrl,
  } from "./globals";
  import { mode } from "./globals";
  import Search from "../lib/search.svelte";
  import { GeoJSON, FillLayer, LineLayer } from "svelte-maplibre";
  import {
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Drawer,
    CloseButton,
    TabItem,
    Tabs,
  } from "flowbite-svelte";

  import { sineIn } from "svelte/easing";
  import SelectedMetrics from "./SelectedMetrics.svelte";
  import PreviewedMetrics from "./PreviewedMetrics.svelte";
  import { onMount } from "svelte";
  import Map from "./Map.svelte";

  import * as duckdb from "@duckdb/duckdb-wasm";
  import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
  import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
  import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
  import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

  let hidden8 = false;
  let transitionParams = {
    y: 320,
    duration: 200,
    easing: sineIn,
  };

  const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: duckdb_wasm,
      mainWorker: mvp_worker,
    },
    eh: {
      mainModule: duckdb_wasm_eh,
      mainWorker: eh_worker,
    },
  };

  export let db = null;

  // Event listener to get bounding box on map load and on view change
  // $map.on("load", updateBoundingBox);
  // $map.on("moveend", updateBoundingBox);
  // updateBoundingBox();
  // let bboxForRequest = bbox.map((el) => Number(el.toFixed(6)));
  // console.log("Bbox", bboxForRequest);

  async function downloadMetrics(dataRequestSpec): Promise<any> {
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    try {
      console.log(dataRequestSpec);
      let metricsSql: string =
        await $rustBackend!.downloadDataRequestMetricsSql(dataRequestSpec);
      console.log(metricsSql);
      const metrics = await getMetrics(
        `INSTALL httpfs; LOAD httpfs; ${metricsSql}`,
      );
      console.log(metrics);
      return metrics;
    } catch (err) {
      window.alert(`Failed to download: ${err}`);
    }
  }

  onMount(async () => {
    try {
      // Set-up duckdb-wasm database: https://duckdb.org/docs/api/wasm/instantiation#vite
      // Select a bundle based on browser checks
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      // Instantiate the asynchronus version of DuckDB-wasm
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      if (db === null) {
        db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      }

      // const metricsDownload = $selectedMetricsList.map((record) => ({
      //   MetricId: {
      //     id: record.metric_id,
      //   },
      // }));
      // console.log(metricsDownload);
      // let dataRequestSpec = {
      //   region: [],
      //   metrics: metricsDownload,
      //   years: [],
      // };

      // const metrics = await downloadMetrics(dataRequestSpec);
      // $previewedMetricsList = metrics;

      // console.log($previewedMetricsList.slice(0, 10));
      // return;
    } catch (err) {
      console.log("Download");
      window.alert(`${err}`);
    }
  });

  async function setPreviewedMetrics(): Promise<Array<Map<any, any>>> {
    const metricsDownload = $selectedMetricsList.map((record) => ({
      MetricId: {
        id: record.metric_id,
      },
    }));
    console.log(metricsDownload);
    let dataRequestSpec = {
      region: [],
      metrics: metricsDownload,
      years: [],
    };
    const metrics = await downloadMetrics(dataRequestSpec);
    $previewedMetricsList = metrics;

    // TODO: set geometry from dataRequestSpec
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    try {
      let tileUrl: string =
        await $rustBackend!.downloadDataRequestGeomsPmtiles(dataRequestSpec);
      console.log(tileUrl);
      $tileUrl = tileUrl;
    } catch (err) {
      window.alert(`Failed to get tile URL: ${err}`);
    }
    console.log($previewedMetricsList.slice(0, 10));
    return;
  }

  // Use duckdb-wasm to get metrics with range request
  async function getMetrics(sqlString: string): Promise<Array<Map<any, any>>> {
    // Create a new connection
    const conn = await db.connect();
    // Query
    const arrowResult = await conn.query(sqlString);
    // Convert arrow table to json
    const result = arrowResult.toArray().map((row) => row.toJSON());
    console.log(result);
    // Close the connection to release memory
    await conn.close();

    return result;
  }

  // TODO: consider if can be async to enable preview to be generated here
  function add(record: Map<any, any>) {
    console.log(record);
    $selectedMetricsList.indexOf(record) === -1
      ? $selectedMetricsList.push(record)
      : console.log("Not added");
    // Reactivity
    $selectedMetricsList = [...$selectedMetricsList];
    return;
  }

  // TODO: consider if previewed metrics can be updated here too
  export function remove(record: Map<any, any>) {
    console.log(record);
    const index = $selectedMetricsList.indexOf(record);
    if (index > -1) {
      $selectedMetricsList.splice(index, 1);
    }
    // Reactivity
    $selectedMetricsList = [...$selectedMetricsList];
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

  // Using bbox
  let bbox = [];
  function updateBoundingBox() {
    const bounds = $map.getBounds();
    bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
  }

  // async function download(dataRequestSpec): Promise<Array<Map<any, any>>> {
  async function download(dataRequestSpec): Promise<any> {
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    try {
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

  // Add debounce to input function so backend search only called after `delay`ms
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      // Clear previous timeout
      clearTimeout(timeout);
      // Set new timeout
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }
  const debouncedHandleInput = debounce(handleInput, 300);

  async function handleClick() {
    // let bboxForRequest = bbox.map((el) => Number(el.toFixed(6)));
    // console.log("Bbox", bboxForRequest);
    // let dataRequestSpec = {
    //   region: [{ BoundingBox: bboxForRequest }],
    //   metrics: [{ MetricId: { id: $previewMetricMap.metric_id } }],
    // };
    // console.log(dataRequestSpec);
    // let gj_out = await download(dataRequestSpec);
    // setMinMax(gj_out);
    // gj = gj_out;
    // console.log($previewMetricMap.metric_parquet_column_name);
    // console.log(gj);
    // console.log(min);
    // console.log(max);
    // removeSource();
    // // TODO: update to use svelte component
    // $map.addSource(sourceData, {
    //   type: "geojson",
    //   data: gj,
    // });
    // $map.addLayer({
    //   id: sourceFillLayer,
    //   type: "fill",
    //   source: sourceData,
    //   paint: {
    //     "fill-color": [
    //       "interpolate",
    //       ["linear"],
    //       ["get", String($previewMetricMap.metric_parquet_column_name)],
    //       0,
    //       "#0a0",
    //       max,
    //       "#a00",
    //     ],
    //     "fill-opacity": 0.5,
    //   },
    // });
    // $map.addLayer({
    //   id: sourceLineLayer,
    //   type: "line",
    //   source: sourceData,
    //   paint: {
    //     "line-color": "black",
    //     "line-width": 0.5,
    //   },
    // });
  }
</script>

<SplitComponent>
  <div slot="sidebar">
    <div style="text-align: left; margin-top: 2.5%; margin-bottom: 5%; ">
      <Button color="light" on:click={() => ($mode = { kind: "title" })}
        >Home</Button
      >
      <Button color="light" on:click={() => (hidden8 = false)}
        >Selected metrics and Preview</Button
      >
    </div>

    <!-- Search -->
    <section
      id="query-section"
      style="text-align: left; margin-top: 2.5%; margin-bottom: 5%; "
    >
      <Search bind:searchTerm on:input={debouncedHandleInput} />
    </section>

    <!-- TODO: convert table for search results into component -->
    <section id="<results-table">
      <Table>
        <TableHead>
          <!-- <TableHeadCell>ID</TableHeadCell> -->
          <TableHeadCell>Name</TableHeadCell>
          <TableHeadCell>Year</TableHeadCell>
          <TableHeadCell>Selected metrics</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
          {#each items as item}
            <TableBodyRow>
              <!-- <TableBodyCell>{item.metric_id.slice(0, 8)}</TableBodyCell> -->
              <TableBodyCell
                class="max-w-md whitespace-normal break-words border-b border-gray-200 px-2 py-2"
                >{item.metric_human_readable_name}</TableBodyCell
              >
              <TableBodyCell
                >{item.source_data_release_collection_period_start.slice(
                  0,
                  4,
                )}</TableBodyCell
              >
              <TableBodyCell>
                <Button color="light" on:click={() => add(item)}>Add</Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </section>
  </div>

  <!-- Map previews downloaded metrics -->

  <div slot="map">
    <Map></Map>

    <div>
      <Drawer
        placement="top"
        position="absolute"
        transitionType="fly"
        width="w-full"
        activateClickOutside={false}
        {transitionParams}
        backdrop={false}
        bind:hidden={hidden8}
        id="sidebar8"
      >
        <CloseButton
          on:click={() => (hidden8 = true)}
          class="mb-4 dark:text-white"
        />
        <Tabs>
          <TabItem open title="Selected Metrics">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <b>Selected metrics</b>
            </p>
            <SelectedMetrics></SelectedMetrics>
          </TabItem>
          <TabItem title="Preview" on:click={() => setPreviewedMetrics()}>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <b
                >Preview of selected metrics <button
                  on:click={() => handleClick()}>(view selected on map)</button
                ></b
              >
            </p>
            <PreviewedMetrics></PreviewedMetrics>
          </TabItem>
        </Tabs>
      </Drawer>
    </div>
  </div>
</SplitComponent>

<!-- <style>
  .overlay {
    /* width: 10px; */
    /* margin: 0 auto; */
    /* padding: 200px; */
  }
</style> -->
