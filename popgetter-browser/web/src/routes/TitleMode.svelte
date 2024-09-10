<script lang="ts">
  import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
  import { mode } from "./globals";

  async function getCountries() {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      const countries = await $rustBackend!.getCountries();
      console.log(countries);
    } catch (err) {
      window.alert(`Failed to get countries: ${err}`);
    }
  }
</script>

<SplitComponent>
  <div slot="sidebar">
    <SimpleComponent name="Stu" />

    <button on:click={() => ($mode = { kind: "colour" })}
      >Enter Colour Mode</button
    >
    <button on:click={() => getCountries()}>Get popgetter countries</button>
  </div>
  <div slot="map"></div>
</SplitComponent>
