import * as Comlink from "comlink";
// import init, { Backend as WasmInterface } from "rust_backend";
import type { FeatureCollection } from "geojson";
import * as duckdb from "@duckdb/duckdb-wasm";

// This is glue to call the Rust backend asynchronously in a web worker, off the main browser thread

export class DuckDBBackend {
  inner: duckdb.AsyncDuckDB | null;

  constructor() {
    this.inner = null;
  }

  async initialise() {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    // Select a bundle based on browser checks
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: "text/javascript",
      }),
    );
    // Instantiate the asynchronus version of DuckDB-Wasm
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);
    this.inner = db;
  }

  unset() {
    this.inner = null;
  }

  isLoaded(): boolean {
    return this.inner != null;
  }

  async getMetrics(sqlString: string): Promise<Array<any>> {
    if (!this.inner) {
      throw new Error("DuckDBBackend not initialised");
    }
    // Create a new connection
    const conn = await this.inner!.connect();
    // Query (including manually loading httpfs)
    const arrowResult = await conn.query(`INSTALL httpfs; LOAD httpfs; ${sqlString}`);
    // Convert arrow table to json
    const result = arrowResult.toArray().map((row) => row.toJSON());
    console.log(result);
    // Close the connection to release memory
    await conn.close();

    return result;
  }

}

Comlink.expose(DuckDBBackend);
