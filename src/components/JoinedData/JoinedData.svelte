<script lang="ts">
	import { updatedLayerContext } from 'svelte-maplibre';
	export let data: Array<Record<string, string | number | undefined>>;
	export let idCol: string;
	export let sourceLayer: string;

	const { map, source } = updatedLayerContext();
	$: if (data && $map && $source) {
		console.log('Assigning data ', data, $map, $source);
		for (const row of data) {
			const id = row[idCol];
			$map.setFeatureState({ id, source: $source, sourceLayer }, row);
		}
	}
</script>
