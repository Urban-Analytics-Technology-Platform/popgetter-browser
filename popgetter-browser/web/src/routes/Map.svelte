<script>
  import {
    MapLibre,
    VectorTileSource,
    FillLayer,
    JoinedData,
  } from "svelte-maplibre";

  import {tileUrl, previewMetricMapColors, previewMetricMap } from "./globals";
</script>

<MapLibre
  style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
  standardControls
  center={[0.0, 53.0]}
  zoom={2}
>
  <VectorTileSource url={$tileUrl} promoteId={"GEO_ID"}>
    <FillLayer
      paint={{
        "fill-color": ["coalesce", ["feature-state", "color"], "#102020"],
      }}
      sourceLayer={"geoms"}
      manageHoverState
    />
    <JoinedData data={$previewMetricMapColors} idCol="GEO_ID" sourceLayer="geoms" />
  </VectorTileSource>
</MapLibre>
