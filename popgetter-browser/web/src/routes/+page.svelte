<script lang="ts">
  import {
    Layout,
    mapContents,
    sidebarContents,
  } from "@uatp/components/two_column_layout";
  import { MapLibre } from "svelte-maplibre";
  import TitleMode from "./TitleMode.svelte";
  import CountriesMode from "./CountriesMode.svelte";

  import { onMount } from "svelte";
  import type { Map } from "maplibre-gl";
  import * as Comlink from "comlink";

  import {
    map as mapStore,
    rustBackend,
    mode,
    selectedCountry,
    selectedLevel,
  } from "./globals";
  import rustWorkerWrapper from "$lib/rust_worker?worker";
  import { type RustBackend } from "$lib/rust_worker";
  import DownloadMode from "./DownloadMode.svelte";
  import LevelsMode from "./LevelsMode.svelte";

  // Everything in this script section is boilerplate; you can ignore it

  // TODO Refactor this part if possible
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
  });

  selectedCountry.set("United States");
  selectedLevel.set("tract");

  let map: Map | undefined = undefined;
  $: if (map) {
    mapStore.set(map);
  }

  let sidebarDiv: HTMLDivElement;
  let mapDiv: HTMLDivElement;
  $: if (sidebarDiv && $sidebarContents) {
    sidebarDiv.innerHTML = "";
    sidebarDiv.appendChild($sidebarContents);
  }
  $: if (mapDiv && $mapContents) {
    mapDiv.innerHTML = "";
    mapDiv.appendChild($mapContents);
  }
</script>

<Layout>
  <div slot="left">
    <h1
      class="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white"
    >
      Popgetter browser
    </h1>
    <div bind:this={sidebarDiv}></div>
  </div>
  <div slot="main" style="position:relative; width: 100%; height: 100vh;">
    <MapLibre
      style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      standardControls
      hash
      bind:map
    >
      <div bind:this={mapDiv}></div>

      <!-- When you define new modes, you have to wire them up here -->

      <!-- {#if $mode.kind == "title"}
        <TitleMode />
      {:else if $mode.kind == "level"}
        <LevelsMode />
      {:else if $mode.kind == "download"}
        <DownloadMode />
      {/if} -->

      <DownloadMode />
    </MapLibre>
  </div>
</Layout>
