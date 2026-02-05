import { createMiddleware } from "@solidjs/start/middleware";

const KEEP_ALIVE_FILE = "/tmp/timings-stats-keep-alive";

// Initialize keep-alive file
if (typeof Deno !== "undefined") {
  try {
    Deno.writeTextFileSync(KEEP_ALIVE_FILE, "");
  } catch (e) {
    console.error("Failed to initialize keep-alive file:", e);
  }
}

// Auto-shutdown mechanism
if (typeof Deno !== "undefined") {
  const INACTIVITY_TIMEOUT = 15000; // 15 seconds
  const checkInterval = setInterval(() => {
    try {
      const stat = Deno.statSync(KEEP_ALIVE_FILE);
      const lastModified = stat.mtime?.getTime() || 0;
      const timeSinceLastRequest = Date.now() - lastModified;
      
      if (timeSinceLastRequest >= INACTIVITY_TIMEOUT) {
        console.log(`[Auto-shutdown] No requests for ${timeSinceLastRequest}ms - shutting down...`);
        clearInterval(checkInterval);
        Deno.exit(0);
      }
    } catch (e) {
      console.error("Error checking keep-alive:", e);
    }
  }, 5000);
}

export default createMiddleware({
  onRequest: [
    (event) => {
      // Touch file to update modification time
      if (typeof Deno !== "undefined") {
        try {
          Deno.utimeSync(KEEP_ALIVE_FILE, new Date(), new Date());
        } catch (e) {
          console.error("Failed to update keep-alive:", e);
        }
      }
    },
  ],
});
