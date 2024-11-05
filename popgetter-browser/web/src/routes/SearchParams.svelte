<script lang="ts">
  import {
    rustBackend,
    rustIsLoaded,
    selectedCountry,
    selectedLevel,
  } from "./globals";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import {
    Button,
    Dropdown,
    DropdownItem,
    GradientButton,
  } from "flowbite-svelte";

  let countries: Array<Map<any, any>> = [];
  let levelsList: [] = [];
  let levels = {
    "United States": ["tract", "county", "block_group"],
    Scotland: ["OutputArea2011", "CouncilArea2011", "DataZone2011"],
    "Northern Ireland": ["LGD14", "DZ21", "SDZ21"],
    "England and Wales": ["msoa", "lsoa", "rgn", "oa", "ctry", "ltla"],
    Belgium: ["statistical_sector", "municipality"],
  };

  onMount(async () => {
    try {
      const loaded = await $rustBackend!.isLoaded();
      if (!loaded) {
        await $rustBackend!.initialise();
      }
      countries = await $rustBackend!.getCountries();
      console.log(countries);
      return;
    } catch (err) {
      window.alert(`Failed to get countries: ${err}`);
    }
  });

  function setCountryAndLevelsList(country: String) {
    $selectedCountry = country;
    levelsList = levels[country];
    console.log("Selected country: ", selectedCountry);
    console.log("Selected level: ", selectedLevel);
  }
  function setLevel(level: String) {
    $selectedLevel = level;
    console.log("Selected country: ", selectedCountry);
    console.log("Selected level: ", selectedLevel);
  }
</script>

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
  <Button class="ms-2 h-6 w-6 text-black dark:text-white"
    >Geometry level<ChevronDownOutline />
    <Dropdown>
      {#each levelsList as level}
        <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
          <DropdownItem on:click={() => setLevel(level)}>{level}</DropdownItem>
        </li>
      {/each}
    </Dropdown>
  </Button>
</div>
