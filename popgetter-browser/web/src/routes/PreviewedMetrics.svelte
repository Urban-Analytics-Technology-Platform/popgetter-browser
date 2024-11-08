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

  import * as duckdb from "@duckdb/duckdb-wasm";
  import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
  import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
  import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
  import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

  const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: duckdb_wasm,
      mainWorker: mvp_worker,
    },
    eh: {
      mainModule: duckdb_wasm_eh,
      mainWorker: eh_worker,
    },
  };

  function setPreviewMetricMap(item: Map<any, any>) {
    console.log("Set preview metric map: ", item);
    previewMetricMap.set(item);
  }

  // Use duckdb-wasm to get metrics with range request
  async function getMetrics(sqlString: string): Promise<Array<Map<any, any>>> {
    // Create a new connection
    const conn = await db.connect();
    // Query
    const arrowResult = await conn.query(sqlString);
    // Convert arrow table to json
    const result = arrowResult.toArray().map((row) => row.toJSON());
    console.log(result);
    // Close the connection to release memory
    await conn.close();

    return result;
  }

  async function downloadMetrics(dataRequestSpec): Promise<any> {
    const loaded = await $rustBackend!.isLoaded();
    if (!loaded) {
      await $rustBackend!.initialise();
    }
    try {
      console.log(dataRequestSpec);
      let metricsSql: string =
        await $rustBackend!.downloadDataRequestMetricsSql(dataRequestSpec);
      console.log(metricsSql);
      const metrics = await getMetrics(
        `INSTALL httpfs; LOAD httpfs; ${metricsSql}`,
      );
      console.log(metrics);
      return metrics;
    } catch (err) {
      window.alert(`Failed to download: ${err}`);
    }
  }

  let db;

  onMount(async () => {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }

      // Set-up duckdb-wasm database: https://duckdb.org/docs/api/wasm/instantiation#vite
      // Select a bundle based on browser checks
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      // Instantiate the asynchronus version of DuckDB-wasm
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

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
