import { createTRPCProxyClient, httpBatchLink, loggerLink } from "@trpc/client";
import { type AppRouter } from "../server/api.ts";
import { transformer } from "../server/transformer.ts";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  // replace example.com with your actual production url
  return ``;
};

// create the client, export it
export const api = createTRPCProxyClient<AppRouter>({
  links: [
    // will print out helpful logs when using client
    loggerLink(),
    // identifies what url will handle trpc requests
    httpBatchLink({ url: `${getBaseUrl()}/trpc`, transformer }),
  ],
});
