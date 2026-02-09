import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { transformer } from "./transformer.ts";
import { getDailySummariesWithTotals, updateSummary } from "./repository.ts";

// Initialize tRPC
const t = initTRPC.create({
  transformer,
});

// Create main router
export const appRouter = t.router({
  keepAlive: t.procedure.mutation(() => {
    console.log("Received keep-alive ping at", new Date().toISOString());
    return { success: true };
  }),

  getDailySummariesWithTotals: t.procedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        client: z.string().optional(),
        project: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      // Call the existing function to get summaries and totals
      return await getDailySummariesWithTotals(input);
    }),

  updateSummary: t.procedure
    .input(
      z.object({
        day: z.date(),
        client: z.string(),
        project: z.string(),
        summary: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await updateSummary(input);
      return { success: true };
    }),
});

// Export the app router type to be imported on the client side
export type AppRouter = typeof appRouter;
