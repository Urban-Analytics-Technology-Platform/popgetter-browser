<script lang="ts">
  // import { SimpleComponent } from "@uatp/components";
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
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

  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";

  function setCountryAndLevelsList(country: String) {
    $selectedCountry = country;
    console.log("Selected country: ", $selectedCountry);
    $mode = { kind: "level" };
  }
  let countries: Array<Map<any, any>> = [];
  onMount(async () => {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      countries = await $rustBackend!.getCountries();
      console.log(countries);
      // levelsList = levels[selectedCountry];
      return;
    } catch (err) {
      window.alert(`Failed to get countries: ${err}`);
    }
  });
</script>

<!-- href="/search_and_download" -->
<SplitComponent>
  <div slot="sidebar">
    <div>
      <Button
        >Country<ChevronDownOutline />
        <!-- TODO: save the selection to then be passed to search params -->
        <Dropdown>
          {#each countries as country}
            <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
              <DropdownItem
                on:click={() =>
                  setCountryAndLevelsList(country.country_name_short_en)}
                >{country.country_name_short_en}
              </DropdownItem>
            </li>
          {/each}
        </Dropdown>
      </Button>
    </div>
    <!-- <div>
      <Button color="light" on:click={() => ($mode = { kind: "download" })}
        >Search and Download<ChevronDoubleRightOutline /></Button
      >
    </div> -->
  </div>
  <div slot="map"></div>
</SplitComponent>
