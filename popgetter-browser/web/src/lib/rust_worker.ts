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

  async addColours(gj: FeatureCollection): Promise<FeatureCollection> {
    if (!this.inner) {
      throw new Error("RustBackend not initialised");
    }
    const result = JSON.parse(this.inner!.addColours(gj));
    console.log("RustBackend.addColours result", result);
    return result;
  }

  async getCountries(): Promise<String> {
    if (!this.inner) {
      throw new Error("RustBackend not initialised");
    }
    // TODO: implement DataFrame to JSON or add popgetter GeoJSONFormatter
    // const result = JSON.parse(await this.inner!.getCountries());
    const result = (await this.inner!.getCountries());
    console.log("RustBackend.getCountries result", result);
    return result;
  }
}

Comlink.expose(RustBackend);
