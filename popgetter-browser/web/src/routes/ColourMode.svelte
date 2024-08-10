<script lang="ts">
  import type { FeatureCollection } from "geojson";
  import { Loading } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { mode, rustBackend, rustIsLoaded } from "./globals";
  import { GeoJSON, FillLayer, LineLayer } from "svelte-maplibre";

  let gj: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  let loadingMessages: string[] = [];
  let fileInput: HTMLInputElement;

  async function getFileContents(): Promise<string> {
    let file = fileInput.files![0];
    if (!file) {
      throw new Error("Please select a file first.");
    }
    return file.text();
  }

  async function colourWithRust() {
    try {
      const contents = await getFileContents();
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      const new_gj = await $rustBackend!.addColours(JSON.parse(contents));
      const countries = await $rustBackend!.getCountries();
      console.log(countries);
      gj = new_gj;
    } catch (err) {
      window.alert(`Failed to open file: ${err}`);
    }
  }
</script>

<SplitComponent>
  <div slot="sidebar">
    <p>Upload a GeoJSON feature collection here:</p>

    <p><input bind:this={fileInput} type="file" /></p>

    <p>
      (Don't have one to hand? You can <a
        href="https://ckan.publishing.service.gov.uk/dataset/westminster-parliamentary-constituencies-july-2024-boundaries-uk-bsc"
        target="_blank">download one here</a
      >.)
    </p>

    <p>and colour it with...</p>

    <p>
      <button on:click={() => colourWithRust()}>Rust! 🦀</button>
    </p>

    <p>
      <button on:click={() => ($mode = { kind: "title" })}
        >Back to Title Mode</button
      >
    </p>
  </div>

  <div slot="map">
    <GeoJSON data={gj}>
      <FillLayer
        paint={{ "fill-color": ["get", "color"], "fill-opacity": 0.5 }}
      />

      <LineLayer paint={{ "line-color": "black", "line-width": 1 }} />
    </GeoJSON>
  </div>
</SplitComponent>

<Loading loading={loadingMessages} />
