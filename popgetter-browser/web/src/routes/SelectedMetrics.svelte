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

  function remove(s: string) {
    // TODO
    console.log(s);
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
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each $selectedMetricsList as item}
        <TableBodyRow>
          <TableBodyCell>{item.metric_id.slice(0, 8)}</TableBodyCell>
          <TableBodyCell>{item.metric_human_readable_name}</TableBodyCell>
          <TableBodyCell>{item.metric_parquet_column_name}</TableBodyCell>
          <TableBodyCell
            >{item.source_data_release_collection_period_start.slice(
              0,
              4,
            )}</TableBodyCell
          >
          <TableBodyCell>
            <Button on:click={() => remove(item.metric_id)}>Remove</Button>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
