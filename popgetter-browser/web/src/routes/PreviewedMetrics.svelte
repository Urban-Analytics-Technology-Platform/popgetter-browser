<script lang="ts">
  import {
    previewedMetricsList,
    previewMetricMap,
    previewMetricMapColors,
    selectedMetricsList,
    tileUrl,
  } from "./globals";
  import {
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";

  import * as d3 from "d3-scale";
  import { interpolateViridis } from "d3-scale-chromatic";

  function setPreviewMetricMap(item: Map<any, any>) {
    console.log("Set preview metric map: ", item);
    previewMetricMap.set(item);
    // console.log($previewMetricMap)
    // console.log(Array.isArray($previewedMetricsList));

    // let columnName = "B25100_E001";
    let columnName = $previewMetricMap.metric_parquet_column_name;
    const min = Math.min(
      ...$previewedMetricsList.map((record) => Number(record[columnName])),
    );
    const max = Math.max(
      ...$previewedMetricsList.map((record) => Number(record[columnName])),
    );
    const colorScale = d3
      .scaleSequential(interpolateViridis)
      .domain([min, max]);
    // console.log(colorScale(100))
    // console.log(columnName)
    // console.log($previewedMetricsList[0])
    console.log("min:", min);
    console.log("max:", max);
    $previewMetricMapColors = $previewedMetricsList.map((record) => {
      if ("color" in record) {
        delete record["color"];
      }
      // console.log(record);
      return {
        ...record,
        color: colorScale(Number(record[columnName])),
      };
    });
    // console.log($previewMetricMapColors);
    console.log($tileUrl);
  }
</script>

<div>
  <Table>
    <TableHead>
      <TableHeadCell>GEO_ID</TableHeadCell>
      {#each $selectedMetricsList as item}
        <TableHeadCell
          ><Button
            size="xs"
            color="light"
            on:click={() => setPreviewMetricMap(item)}
            >{item.metric_parquet_column_name}</Button
          ></TableHeadCell
        >
      {/each}
    </TableHead>
    <TableBody>
      {#each $previewedMetricsList.slice(0, 10) as item}
        <TableBodyRow>
          {#each Object.keys(item).map(function (key) {
            return String(item[key]);
          }) as el}
            <TableBodyCell class="justified">{el}</TableBodyCell>
          {/each}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
