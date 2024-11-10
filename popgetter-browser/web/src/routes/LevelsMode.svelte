<script lang="ts">
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { mode, selectedCountry, selectedLevel } from "./globals";
  import { Button, Dropdown, DropdownItem } from "flowbite-svelte";
  import { ChevronRightOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import Subtitle from "./Subtitle.svelte";
  import TilesMap from "./TilesMap.svelte";

  const levels = {
    "United States": ["tract", "county", "block_group"],
    Scotland: ["OutputArea2011", "CouncilArea2011", "DataZone2011"],
    "Northern Ireland": ["LGD14", "DZ21", "SDZ21"],
    "England and Wales": ["msoa", "lsoa", "rgn", "oa", "ctry", "ltla"],
    Belgium: ["statistical_sector", "municipality"],
  };
  let levelsList = [];

  function setLevel(level: String) {
    $selectedLevel = level;
    console.log("Selected country: ", $selectedCountry);
    console.log("Selected level: ", $selectedLevel);
    $mode = { kind: "download" };
  }

  let mapInstance;

  onMount(async () => {
    try {
      levelsList = levels[$selectedCountry + ""];
      console.log(levelsList);
      return;
    } catch (err) {
      window.alert(`Failed to get levels: ${err}`);
    }
  });
</script>

<!-- href="/search_and_download" -->
<SplitComponent>
  <div slot="sidebar">
    <div>
      <Subtitle></Subtitle>
      <Button>
        <div>
          <h2
            class="font-large text-lg text-gray-500 lg:text-xl dark:text-gray-500"
          >
            <p>Pick geometry level...</p>
          </h2>
          <ChevronRightOutline
            color="grey"
            size="lg"
            class="text-grey ms-2 h-6 w-6 dark:text-gray-500"
          />
        </div></Button
      >
      <Dropdown>
        {#each levelsList as level}
          <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
            <DropdownItem on:click={() => setLevel(level)}>{level}</DropdownItem
            >
          </li>
        {/each}
      </Dropdown>
    </div>
  </div>
  <div slot="map">
    <TilesMap bind:mapInstance></TilesMap>
  </div>
</SplitComponent>
