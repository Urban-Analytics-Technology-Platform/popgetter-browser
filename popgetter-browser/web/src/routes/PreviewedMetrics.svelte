<script lang="ts">
  import {
    previewedMetricsList,
    rustBackend,
    rustIsLoaded,
    selectedCountry,
    selectedLevel,
    selectedMetricsList,
  } from "./globals";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { get } from "svelte/store";

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
      let metricsSql: string =
        await $rustBackend!.downloadDataRequestMetrics(dataRequestSpec);
      const metrics = await getMetrics(metricsSql);
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
      console.log("Test");
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
        <TableHeadCell>{item.metric_parquet_column_name}</TableHeadCell>
      {/each}
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each $previewedMetricsList.slice(0, 20) as item}
        <TableBodyRow>
          <!-- TODO: fix loop as over object not array-->
          {#each item as el}
            <TableBodyCell>{el}</TableBodyCell>
          {/each}
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
