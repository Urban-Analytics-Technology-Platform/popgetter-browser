/* tslint:disable */
/* eslint-disable */
export class Backend {
  free(): void;
  constructor();
  /**
   * @returns {Promise<string>}
   */
  getCountries(): Promise<string>;
  /**
   * @param {any} search_params_js_value
   * @param {number} offset
   * @returns {Promise<string>}
   */
  search(search_params_js_value: any, offset: number): Promise<string>;
  /**
   * @param {any} params_js_value
   * @returns {Promise<string>}
   */
  downloadMetrics(params_js_value: any): Promise<string>;
  /**
   * @param {any} params_js_value
   * @returns {Promise<string>}
   */
  downloadMetricsSql(params_js_value: any): Promise<string>;
  /**
   * @param {any} params_js_value
   * @returns {Promise<string>}
   */
  downloadGeoms(params_js_value: any): Promise<string>;
  /**
   * @param {any} data_request_spec_js_value
   * @param {string} output_format
   * @returns {Promise<string>}
   */
  downloadDataRequest(data_request_spec_js_value: any, output_format: string): Promise<string>;
  /**
   * @param {any} data_request_spec_js_value
   * @returns {Promise<string>}
   */
  downloadDataRequestMetrics(data_request_spec_js_value: any): Promise<string>;
  /**
   * @param {any} data_request_spec_js_value
   * @returns {Promise<string>}
   */
  downloadDataRequestMetricsSql(data_request_spec_js_value: any): Promise<string>;
  /**
   * @param {any} data_request_spec_js_value
   * @returns {Promise<string>}
   */
  downloadDataRequestGeoms(data_request_spec_js_value: any): Promise<string>;
  /**
   * @param {any} data_request_spec_js_value
   * @returns {Promise<string>}
   */
  downloadDataRequestGeomsPmtiles(data_request_spec_js_value: any): Promise<string>;
  /**
   * Add a property called 'color' to each feature in the input GeoJSON. The value is a random
   * colour from Rust's mascot, Ferris.
   * @param {any} input
   * @returns {string}
   */
  addColours(input: any): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_backend_free: (a: number, b: number) => void;
  readonly backend_new: () => number;
  readonly backend_getCountries: (a: number) => number;
  readonly backend_search: (a: number, b: number, c: number) => number;
  readonly backend_downloadMetrics: (a: number, b: number) => number;
  readonly backend_downloadMetricsSql: (a: number, b: number) => number;
  readonly backend_downloadGeoms: (a: number, b: number) => number;
  readonly backend_downloadDataRequest: (a: number, b: number, c: number, d: number) => number;
  readonly backend_downloadDataRequestMetrics: (a: number, b: number) => number;
  readonly backend_downloadDataRequestMetricsSql: (a: number, b: number) => number;
  readonly backend_downloadDataRequestGeoms: (a: number, b: number) => number;
  readonly backend_downloadDataRequestGeomsPmtiles: (a: number, b: number) => number;
  readonly backend_addColours: (a: number, b: number, c: number) => void;
  readonly rust_zstd_wasm_shim_qsort: (a: number, b: number, c: number, d: number) => void;
  readonly rust_zstd_wasm_shim_malloc: (a: number) => number;
  readonly rust_zstd_wasm_shim_memcmp: (a: number, b: number, c: number) => number;
  readonly rust_zstd_wasm_shim_calloc: (a: number, b: number) => number;
  readonly rust_zstd_wasm_shim_free: (a: number) => void;
  readonly rust_zstd_wasm_shim_memcpy: (a: number, b: number, c: number) => number;
  readonly rust_zstd_wasm_shim_memmove: (a: number, b: number, c: number) => number;
  readonly rust_zstd_wasm_shim_memset: (a: number, b: number, c: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h926c1f64abec806a: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h0bc31b695e8b86d8: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
