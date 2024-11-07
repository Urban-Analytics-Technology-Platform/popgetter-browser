<script lang="ts">
  import type { FeatureCollection } from "geojson";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import {
    map,
    previewMetricMap,
    rustBackend,
    selectedCountry,
    selectedLevel,
    selectedMetricsList,
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

  let hidden8 = false;
  let transitionParamsBottom = {
    y: 320,
    duration: 200,
    easing: sineIn,
  };

  onMount(() => {
    // Event listener to get bounding box on map load and on view change
    $map.on("load", updateBoundingBox);
    $map.on("moveend", updateBoundingBox);
    updateBoundingBox();
    let bboxForRequest = bbox.map((el) => Number(el.toFixed(6)));
    console.log("Bbox", bboxForRequest);
  });

  function add(record: Map<any, any>) {
    console.log(record);
    $selectedMetricsList.indexOf(record) === -1
      ? $selectedMetricsList.push(record)
      : console.log("Not added");
    return;
  }

  export function remove(record: Map<any, any>) {
    console.log(record);
    const index = $selectedMetricsList.indexOf(record);
    if (index > -1) {
      $selectedMetricsList.splice(index, 1);
    }
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
      return data;
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

  const sourceData = "geojson-data";
  const sourceFillLayer = "geojson-layer";
  const sourceLineLayer = "geojson-linelayer";
  function removeSource() {
    if ($map.getLayer(sourceFillLayer)) {
      $map.removeLayer(sourceFillLayer);
    }
    if ($map.getLayer(sourceLineLayer)) {
      $map.removeLayer(sourceLineLayer);
    }
    if ($map.getSource(sourceData)) {
      $map.removeSource(sourceData);
    }
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

  let min = 0;
  let max = 0;

  // Function to load GeoJSON data and calculate min/max
  function setMinMax(gj_out) {
    const values = gj_out.features.map(
      (feature) =>
        feature.properties[
          String($previewMetricMap.metric_parquet_column_name)
        ],
    );
    min = Math.min(...values);
    max = Math.max(...values);
  }

  async function handleClick() {
    let bboxForRequest = bbox.map((el) => Number(el.toFixed(6)));
    console.log("Bbox", bboxForRequest);
    let dataRequestSpec = {
      region: [{ BoundingBox: bboxForRequest }],
      metrics: [{ MetricId: { id: $previewMetricMap.metric_id } }],
    };
    console.log(dataRequestSpec);
    let gj_out = await download(dataRequestSpec);
    setMinMax(gj_out);
    gj = gj_out;

    console.log($previewMetricMap.metric_parquet_column_name);
    console.log(gj);
    console.log(min);
    console.log(max);

    removeSource();

    // TODO: update to use svelte component
    $map.addSource(sourceData, {
      type: "geojson",
      data: gj,
    });
    $map.addLayer({
      id: sourceFillLayer,
      type: "fill",
      source: sourceData,
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", String($previewMetricMap.metric_parquet_column_name)],
          0,
          "#0a0",
          max,
          "#a00",
        ],
        "fill-opacity": 0.5,
      },
    });
    $map.addLayer({
      id: sourceLineLayer,
      type: "line",
      source: sourceData,
      paint: {
        "line-color": "black",
        "line-width": 0.5,
      },
    });
  }
</script>

<SplitComponent>
  <div slot="sidebar">
    <div class="text-left">
      <Button on:click={() => ($mode = { kind: "title" })}>Home</Button>
      <Button on:click={() => (hidden8 = false)}>Preview</Button>
    </div>

    <!-- Search -->
    <section id="query-section">
      <Search bind:searchTerm on:input={debouncedHandleInput} />
    </section>

    <!-- TODO: convert table for search results into component -->
    <section id="<results-table">
      <Table>
        <TableHead>
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
                <Button on:click={() => add(item)}>Add</Button>
                <Button on:click={() => remove(item)}>Remove</Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </section>
  </div>

  <!-- Map previews downloaded metrics -->

  <div slot="map">
    <div class="overlay">
      <Drawer
        placement="bottom"
        width="w-full"
        transitionType="fly"
        activateClickOutside={false}
        transitionParams={transitionParamsBottom}
        divClass="overflow-y-auto z-50 p-4 bg-white bg-opacity-90 dark:bg-gray-800"
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
          <TabItem title="Preview">
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

<style>
  .overlay {
    /* vertical-align: bottom; */
    position: absolute;
    /* bottom: 100%; */
    left: 0px;
    /* left: 27%; */
    width: 75%;
    /* height: 20%; */
    /* width: 10%; */
    z-index: 500;
    /* opacity: 100%; */

    /* border-radius: 5px; */
    /* box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); */
  }
</style>
