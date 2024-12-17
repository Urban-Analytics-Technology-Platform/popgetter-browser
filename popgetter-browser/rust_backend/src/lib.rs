#[macro_use]
extern crate log;

mod timer;

use std::sync::Once;

use geojson::{Feature, FeatureCollection};
use log::info;
use polars::{frame::DataFrame, prelude::*};
use rand::seq::SliceRandom;
use serde_json::map::Map;
use wasm_bindgen::prelude::*;

use popgetter::{
    config::Config,
    data_request_spec::DataRequestSpec,
    formatters::{
        CSVFormatter, GeoJSONFormatter, GeoJSONSeqFormatter, OutputFormatter, OutputGenerator,
    },
    metadata::ExpandedMetadata,
    search::{Params, SearchParams, SearchResults},
    Popgetter, COL,
};

use self::timer::Timer;

static START: Once = Once::new();

const MAX_RESULTS: usize = 20;

pub fn get_random_color() -> &'static str {
    let mut rng = rand::thread_rng();
    ["#C28055", "#C91A00", "#D23900", "#FFFFFF", "#F65200"]
        .choose(&mut rng)
        .unwrap()
}

// This struct should contain actual state. This will probably depend on the input passed to the
// constructor. This file (lib.rs) should handle all the WASM interactions, and most of the logic
// should happen in other modules.
#[wasm_bindgen]
pub struct Backend {
    popgetter: Popgetter,
    buffer: Vec<u8>,
    expanded_metadata_df: DataFrame,
}

impl Backend {
    pub fn search_with_cache(&mut self, search_params: &SearchParams) -> SearchResults {
        // TODO: can we reduce the number of clones?
        let search_results = search_params
            .clone()
            .search(&ExpandedMetadata(self.expanded_metadata_df.clone().lazy()));
        // Update cached expanded dataframe
        self.expanded_metadata_df = search_results.0.clone();
        search_results
    }
}

#[wasm_bindgen]
impl Backend {
    fn write_json(&mut self, mut dataframe: DataFrame) -> String {
        self.buffer.clear();
        JsonWriter::new(&mut self.buffer)
            .with_json_format(JsonFormat::Json)
            .finish(&mut dataframe)
            .unwrap();
        String::from_utf8(self.buffer.to_owned()).unwrap()
    }

    #[wasm_bindgen(constructor)]
    pub async fn new() -> Backend {
        // Panics shouldn't happen, but if they do, console.log them.
        console_error_panic_hook::set_once();
        START.call_once(|| {
            console_log::init_with_level(log::Level::Info).unwrap();
        });
        let popgetter = Popgetter::new_with_config(Config {
            base_path: "https://popgetter.blob.core.windows.net/dev/v0.2".into(),
        })
        .await
        .unwrap();
        let expanded_metadata_df = popgetter
            .metadata
            .combined_metric_source_geometry()
            .as_df()
            .collect()
            .unwrap();
        Backend {
            popgetter,
            buffer: Vec::with_capacity(1000000000),
            expanded_metadata_df,
        }
    }

    #[wasm_bindgen(js_name = getCountries)]
    pub async fn countries(&mut self) -> String {
        self.write_json(self.popgetter.metadata.countries.clone())
    }

    #[wasm_bindgen(js_name = search)]
    pub async fn search(&mut self, search_params_js_value: JsValue, offset: u32) -> String {
        // TODO: fix unwraps
        let search_params: SearchParams =
            serde_wasm_bindgen::from_value(search_params_js_value).unwrap();
        self.write_json(
            self.popgetter
                .search(&search_params)
                .0
                // TODO: fix unwrap
                .slice(
                    i64::from(offset) * i64::try_from(MAX_RESULTS).unwrap(),
                    MAX_RESULTS,
                ),
        )
    }

    #[wasm_bindgen(js_name = downloadMetrics)]
    pub async fn download_metrics(&mut self, params_js_value: JsValue) -> String {
        // TODO: fix unwraps
        let params: Params = serde_wasm_bindgen::from_value(params_js_value).unwrap();
        // self.popgetter.download_metrics_sql(&params).await.unwrap()
        let metrics_and_geoms = self.popgetter.download_params(&params).await.unwrap();
        let metrics = metrics_and_geoms.drop("geometry").unwrap();
        self.write_json(metrics)
    }

    #[wasm_bindgen(js_name = downloadMetricsSql)]
    pub async fn download_metrics_sql(&mut self, params_js_value: JsValue) -> String {
        // TODO: fix unwraps
        let params: Params = serde_wasm_bindgen::from_value(params_js_value).unwrap();
        self.popgetter.download_metrics_sql(&params).await.unwrap()
    }

    #[wasm_bindgen(js_name = downloadGeoms)]
    pub async fn download_geoms(&mut self, params_js_value: JsValue) -> String {
        // TODO: fix unwraps
        let params: Params = serde_wasm_bindgen::from_value(params_js_value).unwrap();
        let mut geoms = self.popgetter.download_geoms(&params).await.unwrap();
        let geo_formatter = GeoJSONFormatter;
        geo_formatter.format(&mut geoms).unwrap()
    }

    #[wasm_bindgen(js_name = downloadDataRequest)]
    pub async fn download_data_request(
        &mut self,
        data_request_spec_js_value: JsValue,
        output_format: String,
    ) -> String {
        let data_request_spec =
            serde_wasm_bindgen::from_value::<DataRequestSpec>(data_request_spec_js_value).unwrap();

        let mut geo_df = self
            .popgetter
            .download_data_request_spec(&data_request_spec)
            .await
            .unwrap();

        let output_formatter = match output_format.to_lowercase() {
            s if s == "geojson" => OutputFormatter::GeoJSON(GeoJSONFormatter),
            s if s == "csv" => OutputFormatter::Csv(CSVFormatter::default()),
            s if s == "geojsonseq" => OutputFormatter::GeoJSONSeq(GeoJSONSeqFormatter),
            s => panic!("Output formatter ({s}) not supported. Choose one of: 'csv', 'geojson' or 'geojsonseq'")
        };
        output_formatter.format(&mut geo_df).unwrap()
    }

    #[wasm_bindgen(js_name = downloadDataRequestMetrics)]
    pub async fn download_data_request_metrics(
        &mut self,
        data_request_spec_js_value: JsValue,
    ) -> String {
        // TODO: fix unwraps
        let params: Params =
            serde_wasm_bindgen::from_value::<DataRequestSpec>(data_request_spec_js_value)
                .unwrap()
                .try_into()
                .unwrap();
        let metrics_and_geoms = self.popgetter.download_params(&params).await.unwrap();
        let metrics = metrics_and_geoms.drop("geometry").unwrap();
        let metrics = self.write_json(metrics);
        info!("{}", metrics);
        metrics
    }

    #[wasm_bindgen(js_name = downloadDataRequestMetricsSql)]
    pub async fn download_data_request_metrics_sql(
        &mut self,
        data_request_spec_js_value: JsValue,
    ) -> String {
        // TODO: fix unwraps
        let params: Params =
            serde_wasm_bindgen::from_value::<DataRequestSpec>(data_request_spec_js_value)
                .unwrap()
                .try_into()
                .unwrap();
        let sql = self.popgetter.download_metrics_sql(&params).await.unwrap();
        info!("{}", sql);
        sql
    }

    #[wasm_bindgen(js_name = downloadDataRequestGeoms)]
    pub async fn download_data_request_geoms(
        &mut self,
        data_request_spec_js_value: JsValue,
    ) -> String {
        // TODO: fix unwraps
        let params: Params =
            serde_wasm_bindgen::from_value::<DataRequestSpec>(data_request_spec_js_value)
                .unwrap()
                .try_into()
                .unwrap();
        self.write_json(self.popgetter.download_geoms(&params).await.unwrap())
    }

    #[wasm_bindgen(js_name = downloadDataRequestGeomsPmtiles)]
    pub async fn download_data_request_geoms_pmtiles(
        &mut self,
        data_request_spec_js_value: JsValue,
    ) -> String {
        // TODO: fix unwraps
        let params: Params =
            serde_wasm_bindgen::from_value::<DataRequestSpec>(data_request_spec_js_value)
                .unwrap()
                .try_into()
                .unwrap();
        let search_results = self.popgetter.search(&params.search);

        let mut pmtile_urls = search_results
            .0
            .column(COL::GEOMETRY_FILEPATH_STEM)
            .unwrap()
            .unique()
            .unwrap()
            .str()
            .unwrap()
            .into_iter()
            .map(|file_stem| {
                format!(
                    "pmtiles://{}/{}.pmtiles",
                    self.popgetter.config.base_path,
                    file_stem.unwrap()
                )
            })
            .collect::<Vec<_>>();
        info!("{:#?}", pmtile_urls);
        if pmtile_urls.len().ne(&1) {
            panic!(
                "{} geometries requested. Number of geometries must be 1.",
                pmtile_urls.len()
            );
        }
        pmtile_urls.pop().unwrap()
    }

    /// Add a property called 'color' to each feature in the input GeoJSON. The value is a random
    /// colour from Rust's mascot, Ferris.
    #[wasm_bindgen(js_name = addColours)]
    pub fn add_colours(&self, input: JsValue) -> Result<String, JsValue> {
        // serde is used to parse a JSON object into a Rust struct
        let gj: FeatureCollection = serde_wasm_bindgen::from_value(input)?;
        let mut new_gj = gj.clone();

        // Perform your calculations here. You can extract this block into a separate crate too
        let new_features: Vec<Feature> = gj
            .features
            .into_iter()
            .map(|mut feat| {
                let mut properties = match feat.properties {
                    None => Map::new(),
                    Some(p) => p.clone(),
                };
                properties.insert("color".to_string(), get_random_color().into());
                feat.properties = Some(properties);
                feat
            })
            .collect();
        new_gj.features = new_features;

        // Except for a few primitive types, usually returning values from Rust happens by
        // serializing to JSON, and deserializing in worker.ts
        serde_json::to_string(&new_gj).map_err(err_to_js)
    }
}

fn err_to_js<E: std::fmt::Display>(err: E) -> JsValue {
    JsValue::from_str(&err.to_string())
}

// This is just a toy example of a long, blocking operation. By using the Timer, progress updates
// can be displayed
fn initialise(mut timer: Timer) {
    for step in 0..10 {
        timer.step(format!("do something, step {step}"));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use popgetter::data_request_spec;
    use wasm_bindgen_test::*;

    const EXAMPLE_DATA_REQUEST_SPEC: &str = r#"{
        "region": [
            {"BoundingBox": [-74.251785, 40.647043, -73.673286, 40.91014]}
        ],
        "metrics": [
            {"MetricId": {"id": "f29c1976"}},
            {"MetricId": {"id": "079f3ba3"}},
            {"MetricId": {"id": "81cae95d"}},
            {"MetricText": "Key: uniqueID, Value: B01001_001;"}
        ],
        "years": ["2021"],
        "geometry": {
            "geometry_level": "tract",
            "include_geoms": true
        }
    }"#;

    #[wasm_bindgen_test(async)]
    async fn test_backend() {
        let backend = Backend::new().await;
        info!("{}", backend.popgetter.metadata.countries);
    }

    #[wasm_bindgen_test(async)]
    async fn test_search() {
        let mut backend = Backend::new().await;
        let search_params = Params::try_from(
            serde_json::from_str::<DataRequestSpec>(EXAMPLE_DATA_REQUEST_SPEC).unwrap(),
        )
        .unwrap()
        .search;
        let search_params_js_value = serde_wasm_bindgen::to_value(&search_params).unwrap();
        let results = backend.search(search_params_js_value, 0).await;
        info!("{}", results);
    }

    #[wasm_bindgen_test(async)]
    async fn test_download() {
        let mut backend = Backend::new().await;
        let data_request_spec =
            serde_json::from_str::<DataRequestSpec>(EXAMPLE_DATA_REQUEST_SPEC).unwrap();
        let data_request_spec_js_value = serde_wasm_bindgen::to_value(&data_request_spec).unwrap();
        let results = backend
            .download_data_request(data_request_spec_js_value, "geojson".to_string())
            .await;
        info!("{}", results);
    }
}
