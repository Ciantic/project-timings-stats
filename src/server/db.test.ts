/// <reference types="npm:@types/node" />
/// <reference lib="deno.ns" />

import { assertEquals, assertExists } from "@std/assert";
import { db } from "./db.ts";

Deno.test("db instance exists", () => {
  assertExists(db);
});

Deno.test("query clients table", async () => {
  const clients = await db.selectFrom("client").selectAll().execute();
  assertExists(clients);
  assertEquals(Array.isArray(clients), true);
});

Deno.test("query projects table", async () => {
  const projects = await db.selectFrom("project").selectAll().execute();
  assertExists(projects);
  assertEquals(Array.isArray(projects), true);
});

Deno.test("query timings table", async () => {
  const timings = await db.selectFrom("timing").selectAll().limit(10).execute();
  assertExists(timings);
  assertEquals(Array.isArray(timings), true);
});

Deno.test("query dailySummaries view", async () => {
  const summaries = await db
    .selectFrom("dailySummaries")
    .selectAll()
    .limit(5)
    .execute();
  assertExists(summaries);
  assertEquals(Array.isArray(summaries), true);
});

Deno.test("query dailyTotals view", async () => {
  const totals = await db
    .selectFrom("dailyTotals")
    .selectAll()
    .limit(5)
    .execute();
  assertExists(totals);
  assertEquals(Array.isArray(totals), true);
});

Deno.test("join query - projects with clients", async () => {
  const projectsWithClients = await db
    .selectFrom("project")
    .innerJoin("client", "client.id", "project.clientId")
    .select([
      "project.id",
      "project.name as projectName",
      "client.name as clientName",
    ])
    .limit(5)
    .execute();
  
  assertExists(projectsWithClients);
  assertEquals(Array.isArray(projectsWithClients), true);
});
