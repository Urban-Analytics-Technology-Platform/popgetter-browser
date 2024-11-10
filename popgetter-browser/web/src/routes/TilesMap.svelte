<script>
  import {
    MapLibre,
    VectorTileSource,
    FillLayer,
    JoinedData,
  } from "svelte-maplibre";

  import { tileUrl, previewMetricMapColors } from "./globals";

  // Reactive subscription to get the updates to URL value
  let showMap = true;
  let currentUrl;
  // Subscribe to the store and toggle `showMap` to trigger a re-render
  tileUrl.subscribe((value) => {
    currentUrl = value;
    showMap = false;
    setTimeout(() => (showMap = true), 0);
  });
</script>

{#if showMap}
  <MapLibre
    style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    standardControls
    center={[0.0, 53.0]}
    zoom={2}
  >
    <VectorTileSource url={currentUrl} promoteId={"GEO_ID"}>
      <FillLayer
        paint={{
          "fill-color": ["coalesce", ["feature-state", "color"], "#102020"],
          "fill-opacity": 0.7,
        }}
        sourceLayer={"geoms"}
        manageHoverState
      />
      <JoinedData
        data={$previewMetricMapColors}
        idCol="GEO_ID"
        sourceLayer="geoms"
      />
    </VectorTileSource>
  </MapLibre>
{/if}
