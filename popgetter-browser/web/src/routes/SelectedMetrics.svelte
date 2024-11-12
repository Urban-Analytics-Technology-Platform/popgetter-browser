<script lang="ts">
  import { selectedMetricsList, previewedMetricsList } from "./globals";
  import {
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";

  function remove(record: {}) {
    console.log(record);
    const index = $selectedMetricsList.indexOf(record);
    if (index > -1) {
      $selectedMetricsList.splice(index, 1);
    }
    // Reactivity
    $selectedMetricsList = [...$selectedMetricsList];
    // TODO: update previewed metrics list
    // $previewedMetricsList = [...$previewedMetricsList];
    return;
  }

  export let nameAndDescriptionClass =
    "max-w-md whitespace-normal break-words border-b border-gray-200 px-2 py-2";
</script>

<div>
  <Table>
    <TableHead>
      <TableHeadCell>ID</TableHeadCell>
      <TableHeadCell class={nameAndDescriptionClass}>Name</TableHeadCell>
      <TableHeadCell class={nameAndDescriptionClass}>Description</TableHeadCell>
      <TableHeadCell>Column</TableHeadCell>
      <TableHeadCell>Year</TableHeadCell>
      <TableHeadCell>Selected metrics</TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each $selectedMetricsList as item}
        <TableBodyRow>
          <TableBodyCell>{item.metric_id.slice(0, 8)}</TableBodyCell>
          <TableBodyCell class={nameAndDescriptionClass}
            >{item.metric_human_readable_name}</TableBodyCell
          >
          <TableBodyCell class={nameAndDescriptionClass}
            >{item.metric_description}</TableBodyCell
          >
          <TableBodyCell>{item.metric_parquet_column_name}</TableBodyCell>
          <TableBodyCell
            >{item.source_data_release_collection_period_start.slice(
              0,
              4,
            )}</TableBodyCell
          >
          <TableBodyCell>
            <Button color="light" on:click={() => remove(item)}>Remove</Button>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
