import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/api.ts";
import { UntarStream } from "@std/tar/untar-stream";
import { Buffer } from "@std/streams/buffer";
import { contentType } from "@std/media-types";

// If this gives, error, you should first run `deno task build` to create the tarball
import DATA from "../dist.deno/dist.tar" with { type: "bytes" };
const PORT = 3010;
const HOST = "localhost";

async function serveFileFromTarball(path: string): Promise<Response> {
  const buffer = new Buffer(DATA);
  const tarStream = buffer.readable.pipeThrough(new UntarStream());
  let relative = "." + path; // Ensure path is relative to tar root

  // Default to index.html for root path
  if (path === "/") {
    relative = "./index.html";
  }

  const ext = path.slice(path.lastIndexOf(".") + 1);

  // Search for the requested file in the tar archive
  for await (const entry of tarStream) {
    if (entry.path === relative && entry.readable) {
      return new Response(entry.readable, {
        headers: {
          "content-type": contentType(ext) || "",
        },
      });
    }
    // Drain the stream if it's not the file we're looking for
    if (entry.readable) {
      await entry.readable.cancel();
    }
  }

  return new Response("File not found", { status: 404 });
}

function main() {
  console.log(`Starting server at http://${HOST}:${PORT}/`);

  // Start Chrome in app mode
  new Deno.Command("google-chrome-stable", {
    args: ["--new-window", `--app=http://${HOST}:${PORT}/`],
    stdout: "inherit",
    stderr: "inherit",
  }).outputSync();

  // Auto-shutdown the server if no requests are received for a certain period of time
  const INACTIVITY_TIMEOUT = 15000; // 15 seconds
  let LAST_REQUEST = Date.now();
  const checkInterval = setInterval(() => {
    try {
      const timeSinceLastRequest = Date.now() - LAST_REQUEST;

      if (timeSinceLastRequest >= INACTIVITY_TIMEOUT) {
        console.log(
          `[Auto-shutdown] No requests for ${timeSinceLastRequest}ms - shutting down...`,
        );
        clearInterval(checkInterval);
        Deno.exit(0);
      }
    } catch (e) {
      console.error("Error checking keep-alive:", e);
    }
  }, 5000);

  // Handle requests directly with Deno
  Deno.serve(
    {
      hostname: HOST,
      port: PORT,
    },
    (req) => {
      LAST_REQUEST = Date.now();
      // console.log(req.url);

      // Parse the url to path
      const url = new URL(req.url);

      if (url.pathname.startsWith("/trpc")) {
        // Other from TRPC endpoint
        return fetchRequestHandler({
          endpoint: "/trpc",
          req,
          router: appRouter,
          createContext: () => ({}),
        });
      }

      return serveFileFromTarball(url.pathname);
    },
  );

  // TODO: Handle WebSocket upgrades
  /*
  if (req.headers.get('upgrade') === 'websocket') {
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = (e) => {
  };

  socket.onmessage = async (e) => {
    
  };

  socket.onclose = (e) => {
  };

  socket.onerror = (e) => {
  };

  return response;
  */
}

main();
