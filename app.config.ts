import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";


if (typeof Deno !== "undefined") {
  Deno.env.set("PORT", "3001");
} else {
  process.env.PORT = "3001";
}

// Open browser automatically in development mode
new Deno.Command("xdg-open", {
  args: ["http://localhost:3001/stats"],
}).spawn();

// Auto-shutdown mechanism
let LAST_KEEP_ALIVE_TIME = Date.now();
const INACTIVITY_TIMEOUT = 15000; // 15 seconds
setInterval(() => {
  const timeSinceLastRequest = Date.now() - LAST_KEEP_ALIVE_TIME;
  if (timeSinceLastRequest >= INACTIVITY_TIMEOUT) {
    console.log("No requests for 10 seconds, shutting down...");
    if (typeof Deno !== "undefined") {
      Deno.exit(0);
    } else {
      process.exit(0);
    }
  }
}, 1000);

export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: "request-tracker",
        configureServer(server: any) {
          server.middlewares.use((req: any, res: any, next: any) => {
            LAST_KEEP_ALIVE_TIME = Date.now();
            
            // // Hook into response finish event to measure actual completion time
            // const start_time = performance.now();
            // res.on('finish', () => {
            //   const end_time = performance.now();
            //   const duration = end_time - start_time;
            //   console.log(`Request to ${req.url} took ${duration.toFixed(2)} ms`);
            // });
            
            next();
          });
        },
      },
    ],
  },
});
