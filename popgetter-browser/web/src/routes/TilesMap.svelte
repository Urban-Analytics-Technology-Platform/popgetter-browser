<script lang="ts">
  import {
    MapLibre,
    VectorTileSource,
    FillLayer,
    JoinedData,
    hoverStateFilter,
  } from "svelte-maplibre";

  import { tileUrl, previewMetricMapColors } from "./globals";

  // Reactive subscription to get the updates to URL value
  let showMap = true;
  let currentUrl;
  export let mapInstance;

  // Subscribe to the store and toggle `showMap` to trigger a re-render
  tileUrl.subscribe((value) => {
    currentUrl = value;
    showMap = false;
    setTimeout(() => (showMap = true), 0);
  });

  function handleMapLoad(event) {
    mapInstance = event.detail.map;
  }

  // TODO: upon click show record for GEO_ID from previewMetricMapColors
</script>

{#if showMap}
  <MapLibre
    style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    standardControls
    center={[0.0, 53.0]}
    zoom={2}
    bind:this={mapInstance}
    on:load={handleMapLoad}
  >
    <VectorTileSource url={currentUrl} promoteId={"GEO_ID"}>
      <FillLayer
        paint={{
          "fill-color": ["coalesce", ["feature-state", "color"], "#102020"],
          "fill-opacity": hoverStateFilter(0.7, 1.0),
        }}
        sourceLayer={"geoms"}
        manageHoverState
        eventsIfTopMost
        hoverCursor="pointer"
      />

      <JoinedData
        data={$previewMetricMapColors}
        idCol="GEO_ID"
        sourceLayer="geoms"
      />
    </VectorTileSource>
  </MapLibre>
{/if}
