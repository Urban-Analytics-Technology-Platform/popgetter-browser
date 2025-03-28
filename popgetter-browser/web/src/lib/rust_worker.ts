import * as Comlink from "comlink";
import init, { Backend as WasmInterface } from "rust_backend";
import type { FeatureCollection } from "geojson";

// This is glue to call the Rust backend asynchronously in a web worker, off the main browser thread

export class RustBackend {
  inner: WasmInterface | null;

  constructor() {
    this.inner = null;
  }

  async initialise() {
    // It's safe to call this repeatedly
    await init();
    this.inner = await new WasmInterface();
  }

  unset() {
    this.inner = null;
  }

  isLoaded(): boolean {
    return this.inner != null;
  }

  isLoadedWithThrow() {
    if (!this.isLoaded()) {
      throw new Error("RustBackend not initialised");
    }
  }

  async addColours(gj: FeatureCollection): Promise<FeatureCollection> {
    this.isLoadedWithThrow();
    const result = JSON.parse(this.inner!.addColours(gj));
    console.log("RustBackend.addColours result", result);
    return result;
  }

  async getCountries(): Promise<String> {
    this.isLoadedWithThrow();
    const result = JSON.parse(await this.inner!.getCountries());
    console.log("RustBackend.getCountries result", result);
    return result;
  }

  async search(search_params: {}, offset: number): Promise<String> {
    this.isLoadedWithThrow();
    const result = JSON.parse(await this.inner!.search(search_params, offset));
    // console.log("RustBackend.getCountries result", result);
    return result;
  }

  async downloadMetrics(params: {}): Promise<String> {
    this.isLoadedWithThrow();
    const result = JSON.parse(await this.inner!.downloadMetrics(params));
    // console.log("RustBackend.getCountries result", result);
    return result;
  }
  async downloadGeoms(params: {}): Promise<String> {
    this.isLoadedWithThrow();
    const result = JSON.parse(await this.inner!.downloadGeoms(params));
    // console.log("RustBackend.getCountries result", result);
    return result;
  }
  async downloadDataRequestMetrics(
    data_request_spec: {},
  ): Promise<String> {
    this.isLoadedWithThrow();
    const result =
      await this.inner!.downloadDataRequestMetrics(data_request_spec);
    // console.log("RustBackend.getCountries result", result);
    return result;
  }
  async downloadDataRequestMetricsSql(
    data_request_spec: {},
  ): Promise<String> {
    this.isLoadedWithThrow();
    const result =
      await this.inner!.downloadDataRequestMetricsSql(data_request_spec);
    return result;
  }
  async downloadDataRequestGeoms(
    data_request_spec: {},
  ): Promise<String> {
    this.isLoadedWithThrow();
    const result = JSON.parse(
      await this.inner!.downloadDataRequestGeoms(data_request_spec),
    );
    // console.log("RustBackend.getCountries result", result);
    return result;
  }
  async downloadDataRequestGeomsPmtiles(
    data_request_spec: {},
  ): Promise<String> {
    this.isLoadedWithThrow();
    const result = await this.inner!.downloadDataRequestGeomsPmtiles(data_request_spec);
    // console.log("RustBackend.getCountries result", result);
    return result;
  }

  async downloadDataRequest(data_request_spec: {}, outputFormat: string = "geojson"): Promise<String> {
    this.isLoadedWithThrow();
    const result = await this.inner!.downloadDataRequest(data_request_spec, outputFormat);
    // console.log("RustBackend.getCountries result", result);
    return result;
  }
}

Comlink.expose(RustBackend);
