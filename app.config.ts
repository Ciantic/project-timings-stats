import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  middleware: "./src/middleware.ts",
  vite: {
    server: {
      watch: {
        // Some reason updating database via node:sqlite triggers package.json change, reloading the whole page
        ignored: ["**/package.json"],
      },
    },
    plugins: [tailwindcss()],
  },
});
