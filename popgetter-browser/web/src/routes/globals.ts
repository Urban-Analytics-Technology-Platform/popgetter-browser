// This file has global state that can be used anywhere in the app, without plumbing props

import type { Map } from "maplibre-gl";
import { writable, type Writable } from "svelte/store";
import * as Comlink from "comlink";
import { type RustBackend } from "$lib/rust_worker";

// Using the MapLibre map directly isn't needed often; try to use
// svelte-maplibre components inside the "map" slot
export const map: Writable<Map | null> = writable(null);

// This is the way to call the backend
export const rustBackend: Writable<Comlink.Remote<RustBackend> | null> =
  writable(null);
// Indicates the backend has a file loaded and is ready
export const rustIsLoaded = writable(false);

// Your app should be organized into distinct modes (think of as distinct pages
// of a site, sharing the same layout). These can have parameters by adding
// fields to each case.
export type Mode = { kind: "title" } | { kind: "level" } | { kind: "download" };

export const mode: Writable<Mode> = writable({ kind: "title" });
export const selectedCountry: Writable<String> = writable("");
export const selectedLevel: Writable<String> = writable("");
export const selectedMetricsList: Writable<Array<Map<any, any>>> = writable([]);
export const previewedMetricsList: Writable<Array<Map<any, any>>> = writable(
  [],
);
