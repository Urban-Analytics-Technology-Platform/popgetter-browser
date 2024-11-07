import type { Config } from "tailwindcss";
import flowbitePlugin from "flowbite/plugin";
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    // Required for flowbite-svelte to work
    "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
  ],
  important: true,
  theme: {
    extend: {},
  },
  // Example of how to set colours
  // https://flowbite-svelte.com/docs/pages/colors
  plugins: [require("@tailwindcss/typography"), flowbitePlugin],
} as Config;
