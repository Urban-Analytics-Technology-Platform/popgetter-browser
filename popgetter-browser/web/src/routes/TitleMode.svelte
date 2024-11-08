<script lang="ts">
  // import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded, tileUrl, countries, previewMetricMapColors } from "./globals";
  import { mode, selectedCountry, selectedLevel } from "./globals";
  import {
    Button,
    Checkbox,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Drawer,
    CloseButton,
    A,
    TabItem,
    Tabs,
    Dropdown,
    DropdownItem,
  } from "flowbite-svelte";

  import {
    ChevronRightOutline,
    ChevronDownOutline,
  } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import Subtitle from "./Subtitle.svelte";
  import Map from "./Map.svelte";

  function setCountryAndLevelsList(country: String) {
    $selectedCountry = country;
    console.log("Selected country: ", $selectedCountry);
    $mode = { kind: "level" };
  }

  onMount(async () => {
    $previewMetricMapColors = [];
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
    <!-- <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600"></li> -->
    <!-- <div>
      <Button color="light" on:click={() => ($mode = { kind: "download" })}
        >Search and Download<ChevronDoubleRightOutline /></Button
      >
    </div> -->
  </div>
  <div slot="map">
    <Map
    
    ></Map>
  </div>
</SplitComponent>
