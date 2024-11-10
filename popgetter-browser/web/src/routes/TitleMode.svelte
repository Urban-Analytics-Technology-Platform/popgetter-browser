<script lang="ts">
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import {
    countries,
    previewMetricMapColors,
    previewedMetricsList,
    selectedMetricsList,
  } from "./globals";
  import { mode, selectedCountry, selectedLevel } from "./globals";
  import { Button, Dropdown, DropdownItem } from "flowbite-svelte";

  import { ChevronRightOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import Subtitle from "./Subtitle.svelte";

  import TilesMap from "./TilesMap.svelte";

  function setCountryAndLevelsList(country: String) {
    $selectedCountry = country;
    console.log("Selected country: ", $selectedCountry);
    $mode = { kind: "level" };
  }

  onMount(async () => {
    $previewMetricMapColors = [];
    $selectedMetricsList = [];
    $previewedMetricsList = [];
  });
</script>

<SplitComponent>
  <div slot="sidebar">
    <div>
      <Subtitle></Subtitle>
      <Button>
        <div>
          <h2
            class="font-large text-lg text-gray-500 lg:text-xl dark:text-gray-500"
          >
            <p>Pick country...</p>
          </h2>
          <ChevronRightOutline
            color="grey"
            size="lg"
            class="text-grey ms-2 h-6 w-6 dark:text-gray-500"
          />
        </div></Button
      >
      <!-- TODO: save the selection to then be passed to search params -->
      <Dropdown placement="right-start">
        {#each $countries as country}
          <DropdownItem
            on:click={() =>
              setCountryAndLevelsList(country.country_name_short_en)}
            >{country.country_name_short_en}
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>
  </div>
  <div slot="map">
    <TilesMap></TilesMap>
  </div>
</SplitComponent>
