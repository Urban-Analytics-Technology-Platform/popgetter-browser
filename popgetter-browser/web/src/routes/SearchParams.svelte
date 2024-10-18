<script lang="ts">
  // import { SimpleComponent } from "@uatp/components";
  // import { SplitComponent } from "@uatp/components/two_column_layout";
  import { rustBackend, rustIsLoaded } from "./globals";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  // import { mode } from "./globals";
  import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownHeader,
    DropdownDivider,
  } from "flowbite-svelte";
  import Search from "../lib/search.svelte";

  // let countries_list: Array<Array<String>> = [];
  let countries: Array<Map<any, any>> = [];
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

  let activeClass =
    "text-green-500 dark:text-green-300 hover:text-green-700 dark:hover:text-green-500";
  let param = "test";
</script>

<div>
  <!-- <section id="query-section">
    <Search bind:searchTerm on:input={handleInput} />
  </section> -->

  <!-- <Button
    >Dropdown button<ChevronDownOutline
      class="w-6 h-6 ms-2 text-white dark:text-white"
    /></Button
  > -->
  <Button
    >Dropdown button<ChevronDownOutline
      class="w-6 h-6 ms-2 text-white dark:text-white"
    /></Button
  >
  <!-- TODO: save the selection to then be passed to search params -->
  <Dropdown>
    {#each countries as country}
      <DropdownItem>{country.country_name_short_en}</DropdownItem>
    {/each}
  </Dropdown>
</div>
<!-- <section id="country-section">
      <Search bind:searchTerm on:input={handleInput} />
    </section> -->
