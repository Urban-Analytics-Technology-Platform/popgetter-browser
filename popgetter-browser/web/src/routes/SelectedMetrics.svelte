<script lang="ts">
  import {
    rustBackend,
    rustIsLoaded,
    selectedCountry,
    selectedLevel,
    selectedMetricsList,
  } from "./globals";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import {
    Button,
    Dropdown,
    DropdownItem,
    GradientButton,
    Checkbox,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Drawer,
    CloseButton,
    A,
    TabItem,
    Tabs,
  } from "flowbite-svelte";
  import { get } from "svelte/store";

  function remove(record: Map<any, any>) {
    console.log(record);
    const index = $selectedMetricsList.indexOf(record);
    if (index > -1) {
      $selectedMetricsList.splice(index, 1);
    }
    // Reactivity
    $selectedMetricsList = [...$selectedMetricsList];
    return;
  }
</script>

<div>
  <Table>
    <TableHead>
      <TableHeadCell>ID</TableHeadCell>
      <TableHeadCell>Name</TableHeadCell>
      <TableHeadCell>Column</TableHeadCell>
      <TableHeadCell>Year</TableHeadCell>
      <TableHeadCell>Selected metrics</TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each $selectedMetricsList as item}
        <TableBodyRow>
          <TableBodyCell>{item.metric_id.slice(0, 8)}</TableBodyCell>
          <TableBodyCell
            class="max-w-md whitespace-normal break-words border-b border-gray-200 px-2 py-2"
            >{item.metric_human_readable_name}</TableBodyCell
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
