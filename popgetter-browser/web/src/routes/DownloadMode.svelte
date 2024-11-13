<script lang="ts">
  import type { FeatureCollection } from "geojson";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import {
    duckdbBackend,
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
  import { v4 as uuidv4 } from "uuid";
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
    NumberInput,
    TabItem,
    Tabs,
    Label,
    Input,
    Dropdown,
    DropdownItem,
    ButtonGroup,
  } from "flowbite-svelte";

  import { sineIn } from "svelte/easing";
  import SelectedMetrics from "./SelectedMetrics.svelte";
  import PreviewedMetrics from "./PreviewedMetrics.svelte";
  import { onMount } from "svelte";
  import TilesMap from "./TilesMap.svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { writable } from "svelte/store";

  const outputFormats: string[] = ["geojson", "csv", "geojsonseq"];
  let selectedOutputFormat: string = "csv";
  let bounds:
    | { _sw: { lat: number; lng: number }; _ne: { lat: number; lng: number } }
    | undefined;
  let bbox: string = "";
  let hidden8 = false;
  let transitionParams = {
    y: 320,
    duration: 200,
    easing: sineIn,
  };

  async function downloadMetrics(dataRequestSpec: {}): Promise<any> {
    try {
      console.log(dataRequestSpec);
      if (!(await $rustBackend!.isLoaded())) {
        await $rustBackend!.initialise();
      }
      let metricsSql: string =
        await $rustBackend!.downloadDataRequestMetricsSql(dataRequestSpec);
      console.log(metricsSql);

      if (!(await $duckdbBackend!.isLoaded())) {
        await $duckdbBackend!.initialise();
      }
      const metrics = await $duckdbBackend!.getMetrics(metricsSql);
      console.log(metrics);
      return metrics;
    } catch (err) {
      window.alert(`Failed to download: ${err}`);
    }
  }

  async function setPreviewedMetrics(): Promise<Array<{}>> {
    // Return if no selected metrics
    if ($selectedMetricsList.length === 0) {
      return [];
    }
    // Get metrics
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

    // Get and set PMTiles URL from data request spec
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

  function getPopgetterCli(): string {
    let ids = $selectedMetricsList
      .map((record: {}) => `--id ${record.metric_id}`)
      .join(" ");
    let outputFormatStr = "--output-format " + selectedOutputFormat;
    let bboxStr = bbox === "" ? "" : "--bbox " + bbox;

    return ["popgetter", "data", ids, outputFormatStr, bboxStr].join(" ");
  }

  // TODO: consider if can be async to enable preview to be generated here
  function add(record: {}) {
    console.log(record);
    $selectedMetricsList.indexOf(record) === -1
      ? $selectedMetricsList.push(record)
      : console.log("Not added");
    // Reactivity
    $selectedMetricsList = [...$selectedMetricsList];
    return;
  }

  // TODO: consider if previewed metrics can be updated here too
  export function remove(record: {}) {
    console.log(record);
    const index = $selectedMetricsList.indexOf(record);
    if (index > -1) {
      $selectedMetricsList.splice(index, 1);
    }
    // Reactivity
    $selectedMetricsList = [...$selectedMetricsList];
    return;
  }

  async function search(x, offset): Promise<Array<{}>> {
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

  // Assign bounding box from bounds
  function updateBoundingBox() {
    console.log("Bounds:", bounds);
    bbox = [bounds._sw.lng, bounds._sw.lat, bounds._ne.lng, bounds._ne.lat]
      .map((el) => Number(el.toFixed(6)).toString())
      .join(",");
  }

  async function download(dataRequestSpec: {}): Promise<String> {
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    try {
      // Download directly with backend without range requests as not impl for wasm
      console.log(dataRequestSpec);
      let metricsAndGeoms = await $rustBackend!.downloadDataRequest(
        dataRequestSpec,
        selectedOutputFormat,
      );
      console.log(metricsAndGeoms);
      return metricsAndGeoms;
    } catch (err) {
      window.alert(`Failed to download: ${err}`);
    }
  }

  function downloadAsFile(content: string) {
    let filename = uuidv4() + "." + selectedOutputFormat.toLowerCase();
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // For search input
  let searchTerm = "";

  // For search input
  let searchParams = {};

  // For search results
  let data: Array<{}> = [];
  let items: Array<{}> = [];

  const page = writable<number>(0);

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
    console.log($page);
    // TODO: update once pagination implemnted
    data = await search(searchParams, $page);
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

  async function downloadAndSave() {
    console.log("Bbox", bbox);
    let dataRequestSpec = {
      region:
        bbox === ""
          ? []
          : [
              {
                BoundingBox: bbox
                  .split(",")
                  .map((el) => Number(Number(el).toFixed(6))),
              },
            ],
      metrics: $selectedMetricsList.map((metric) => ({
        MetricId: {
          id: metric.metric_id,
        },
      })),
    };
    console.log("DataRequestSpec");
    console.log(dataRequestSpec);
    downloadAsFile(await download(dataRequestSpec));
  }

  // Classes and styles
  const nameAndDescriptionClass =
    "max-w-md whitespace-normal break-words border-b border-gray-200 px-2 py-2";
  const divStyle = "text-align: left; margin-top: 2.5%; margin-bottom: 5%; ";
  const downloadDivStyle =
    "text-align: left; margin-top: 1.0%; margin-bottom: 1.0%; ";
</script>

<SplitComponent>
  <div slot="sidebar">
    <div style={divStyle}>
      <Button color="light" on:click={() => ($mode = { kind: "title" })}
        >Home</Button
      >
      <Button color="light" on:click={() => (hidden8 = false)}
        >Selected metrics and Preview</Button
      >
    </div>

    <!-- Search -->
    <section id="query-section" style={divStyle}>
      <Label class="space-y-2">
        Search term
        <Search bind:searchTerm on:input={debouncedHandleInput} />
      </Label>

      <Label class="space-y-2">
        Page
        <NumberInput bind:value={$page} on:input={debouncedHandleInput} />
      </Label>
    </section>

    <!-- TODO: convert table for search results into component -->
    <section id="results-table">
      <Table>
        <TableHead>
          <TableHeadCell>Name</TableHeadCell>
          <TableHeadCell>Year</TableHeadCell>
          <TableHeadCell>Selected metrics</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
          {#each items as item}
            <TableBodyRow>
              <TableBodyCell class={nameAndDescriptionClass}
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
    <TilesMap bind:bounds></TilesMap>

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
                  on:click={() => downloadAndSave()}
                  >(view selected on map)</button
                ></b
              >
            </p>
            <PreviewedMetrics></PreviewedMetrics>
          </TabItem>
          <!-- TODO: complete adding interface for advanced search -->
          <TabItem title="Advanced Search">
            <!-- Search -->
            <section id="query-section" style={divStyle}>
              <Label class="space-y-2">
                Search term
                <Search bind:searchTerm on:input={debouncedHandleInput} />
              </Label>

              <Label class="space-y-2">
                Page
                <NumberInput
                  bind:value={$page}
                  on:input={debouncedHandleInput}
                />
              </Label>
            </section>

            <!-- TODO: convert table for search results into component -->
            <section id="results-table">
              <Table>
                <TableHead>
                  <!-- <TableHeadCell>ID</TableHeadCell> -->
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell>Year</TableHeadCell>
                  <TableHeadCell>Selected metrics</TableHeadCell>
                </TableHead>
                <TableBody tableBodyClass="divide-y">
                  {#each items as item}
                    <TableBodyRow>
                      <TableBodyCell class={nameAndDescriptionClass}
                        >{item.metric_human_readable_name}</TableBodyCell
                      >
                      <TableBodyCell class={nameAndDescriptionClass}
                        >{item.metric_description}</TableBodyCell
                      >
                      <TableBodyCell
                        >{item.source_data_release_collection_period_start.slice(
                          0,
                          4,
                        )}</TableBodyCell
                      >
                      <TableBodyCell>
                        <Button color="light" on:click={() => add(item)}
                          >Add</Button
                        >
                      </TableBodyCell>
                    </TableBodyRow>
                  {/each}
                </TableBody>
              </Table>
            </section>
          </TabItem>
          <TabItem
            title="Download"
            on:click={() => {
              updateBoundingBox();
              setPreviewedMetrics();
            }}
          >
            <div class="pt-8">
              <div style={downloadDivStyle}>
                <Label class="space-y-2"
                  ><span>Bounding Box (left, bottom, right, top)</span></Label
                >
                <ButtonGroup class="w-full">
                  <Input
                    id="bbox"
                    type="text"
                    placeholder=""
                    bind:value={bbox}
                  />
                  <Button
                    color="light"
                    on:click={() => updateBoundingBox()}
                    class="w-80">Get from map</Button
                  >
                </ButtonGroup>
              </div>
              <div style={downloadDivStyle}>
                <Label class="space-y-2">
                  Output format:
                  <Button color="light">
                    {selectedOutputFormat}
                    <ChevronDownOutline class="ms-2 h-6 w-6" />
                  </Button>
                  <Dropdown>
                    {#each outputFormats as outputFormat}
                      <DropdownItem
                        on:click={() => (selectedOutputFormat = outputFormat)}
                        >{outputFormat}
                      </DropdownItem>
                    {/each}
                  </Dropdown>
                </Label>
              </div>
            </div>
            <div style={downloadDivStyle}>
              <Label class="space-y-2">
                Popgetter CLI command
                <ButtonGroup class="w-full">
                  <Input
                    id="popgetter-data-cli"
                    readonly
                    value={getPopgetterCli()}
                  />
                  <Button
                    color="light"
                    data-copy-to-clipboard-target="popgetter-data-cli"
                    on:click={() => {
                      console.log(getPopgetterCli());
                      navigator.clipboard.writeText(getPopgetterCli());
                    }}>Copy</Button
                  >
                </ButtonGroup>
              </Label>
            </div>
            <div style={downloadDivStyle}>
              <Label class="space-y-2">
                Download and save data
                <ButtonGroup class="w-full">
                  <Button
                    color="light"
                    on:click={() => {
                      downloadAndSave();
                    }}>Download and save</Button
                  >
                </ButtonGroup>
              </Label>
            </div>
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
