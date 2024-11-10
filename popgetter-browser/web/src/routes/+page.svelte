<script lang="ts">
  import {
    Layout,
    mapContents,
    sidebarContents,
  } from "@uatp/components/two_column_layout";
  import TitleMode from "./TitleMode.svelte";

  import { onMount } from "svelte";
  import type { Map } from "maplibre-gl";
  import * as Comlink from "comlink";

  import { rustBackend, mode, countries, duckdbBackend } from "./globals";
  import rustWorkerWrapper from "$lib/rust_worker?worker";
  import { type RustBackend } from "$lib/rust_worker";
  import { type DuckDBBackend } from "$lib/duckdb_worker";
  import duckdbWorkerWrapper from "$lib/duckdb_worker?worker";
  import DownloadMode from "./DownloadMode.svelte";
  import LevelsMode from "./LevelsMode.svelte";
  import { Spinner } from "flowbite-svelte";

  let completedOnMount = false;

  onMount(async () => {
    // If you get "import declarations may only appear at top level of a
    // module", then you need a newer browser.
    // https://caniuse.com/mdn-api_worker_worker_ecmascript_modules
    //
    // In Firefox 112, go to about:config and enable dom.workers.modules.enabled
    //
    // Note this should work fine in older browsers when doing 'npm run build'.
    // It's only a problem during local dev mode.
    interface RustWorkerConstructor {
      new (): RustBackend;
    }
    const MyRustWorker: Comlink.Remote<RustWorkerConstructor> = Comlink.wrap(
      new rustWorkerWrapper(),
    );
    let rustBackendWorker = await new MyRustWorker();
    rustBackend.set(rustBackendWorker);

    // DuckDB
    interface DuckDBWorkerConstructor {
      new (): DuckDBBackend;
    }
    const MyDuckDBWorker: Comlink.Remote<DuckDBWorkerConstructor> =
      Comlink.wrap(new duckdbWorkerWrapper());
    let duckdbBackendWorker = await new MyDuckDBWorker();
    duckdbBackend.set(duckdbBackendWorker);

    // Init countries
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    $countries = await $rustBackend!.getCountries();
    console.log($countries);
    completedOnMount = true;
  });

  // For debugging
  // selectedCountry.set("United States");
  // selectedLevel.set("tract");

  // let map: Map | undefined = undefined;
  // $: if (map) {
  //   mapStore.set(map);
  // }

  let sidebarDiv: HTMLDivElement;
  let mapDiv: HTMLDivElement;
  $: if (sidebarDiv && $sidebarContents) {
    sidebarDiv.innerHTML = "";
    sidebarDiv.appendChild($sidebarContents);
  }
  // $: if (mapDiv && $mapContents) {
  //   mapDiv.innerHTML = "";
  //   mapDiv.appendChild($mapContents);
  // }
</script>

<Layout>
  <div slot="left">
    <h1
      class="lg:text-6s md:text-5s mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-gray-900"
    >
      Popgetter browser
    </h1>
    <div bind:this={sidebarDiv}></div>
  </div>
  <div slot="main" style="position:relative; width: 100%; height: 100vh;">
    <!-- <MapLibre
      style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      standardControls
      hash
      bind:map
    > -->
    <!-- <div bind:this={mapDiv}></div> -->

    <!-- When you define new modes, you have to wire them up here -->
    {#if completedOnMount}
      {#if $mode.kind == "title"}
        <TitleMode />
      {:else if $mode.kind == "level"}
        <LevelsMode />
      {:else if $mode.kind == "download"}
        <DownloadMode />
      {/if}
    {:else}
      <Spinner></Spinner>
    {/if}
    <!-- </MapLibre> -->
  </div>
</Layout>
