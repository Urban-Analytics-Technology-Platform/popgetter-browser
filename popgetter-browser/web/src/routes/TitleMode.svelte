<script lang="ts">
  // import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
  import { mode } from "./globals";

</script>

<SplitComponent>
  <div slot="sidebar">
    <!-- <SimpleComponent name="Stu" /> -->

    <button on:click={() => ($mode = { kind: "countries" })}
      >Countries</button
    >
    <button on:click={() => ($mode = { kind: "search" })}
      >Search</button
    >
  </div>
  <div slot="map"></div>
</SplitComponent>
