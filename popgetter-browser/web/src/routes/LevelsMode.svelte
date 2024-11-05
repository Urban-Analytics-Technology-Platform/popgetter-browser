<script lang="ts">
  import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
  import { mode, selectedCountry, selectedLevel } from "./globals";
  import SearchParams from "./SearchParams.svelte";
  import { Button, Dropdown, DropdownItem } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";

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

  onMount(async () => {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      // countries = await $rustBackend!.getCountries();
      // console.log(countries);
      levelsList = levels[$selectedCountry + ""];
      console.log(levelsList);
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
      <!-- <SearchParams></SearchParams> -->
      <Button class="ms-2 h-6 w-6 text-black dark:text-white"
        >Geometry level<ChevronDownOutline />
        <Dropdown>
          {#each levelsList as level}
            <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
              <DropdownItem on:click={() => setLevel(level)}
                >{level}</DropdownItem
              >
            </li>
          {/each}
        </Dropdown>
      </Button>
    </div>
  </div>
</SplitComponent>
