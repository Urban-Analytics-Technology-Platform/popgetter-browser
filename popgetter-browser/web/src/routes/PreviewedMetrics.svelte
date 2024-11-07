<script lang="ts">
  import {
    previewedMetricsList,
    previewMetricMap,
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
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { get } from "svelte/store";

  function setPreviewMetricMap(item: Map<any, any>) {
    console.log("Set preview metric map: ", item);
    previewMetricMap.set(item);
  }

  async function getMetrics(sqlString: string): Promise<any> {
    if (sqlString.length > 0) {
      let data = await fetch(`/api/download?metrics=${sqlString}`)
        .then((r) => r.json())
        .then((data) => {
          console.log("Got result ", data);
          return data;
        });
      return data;
    }
  }

  async function downloadMetrics(dataRequestSpec): Promise<any> {
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    try {
      console.log(dataRequestSpec);
      // Use only rust_backend to get metrics. Currently this has to
      // get the whole file so is inefficient as does not use range
      // request for the selected metrics only
      let metrics: string = JSON.parse(
        await $rustBackend!.downloadDataRequestMetrics(dataRequestSpec),
      );

      // If using the duckdb server for range requests, uncomment the below
      // but for a static site, this will not work
      // let metricsSql: string =
      //   await $rustBackend!.downloadDataRequestMetricsSql(dataRequestSpec);
      // const metrics = await getMetrics(metricsSql);
      console.log(metrics);
      return metrics;
    } catch (err) {
      window.alert(`Failed to download: ${err}`);
    }
  }

  onMount(async () => {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      const metricsDownload = $selectedMetricsList.map((record) => ({
        MetricId: {
          id: record.metric_id,
        },
      }));
      console.log(metricsDownload);
      let dataRequestSpec = {
        region: [],
        metrics: metricsDownload,
        years: [],
      };

      const metrics = await downloadMetrics(dataRequestSpec);
      $previewedMetricsList = metrics;

      console.log($previewedMetricsList.slice(0, 10));
      return;
    } catch (err) {
      window.alert(`Failed to get countries: ${err}`);
    }
  });
</script>

<div>
  <Table>
    <TableHead>
      <TableHeadCell>GEO_ID</TableHeadCell>
      {#each $selectedMetricsList as item}
        <Button on:click={() => setPreviewMetricMap(item)}
          ><TableHeadCell>{item.metric_parquet_column_name}</TableHeadCell
          ></Button
        >
      {/each}
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each $previewedMetricsList.slice(0, 20) as item}
        <TableBodyRow>
          {#each Object.keys(item).map(function (key) {
            return item[key];
          }) as el}
            <TableBodyCell>{el}</TableBodyCell>
          {/each}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
