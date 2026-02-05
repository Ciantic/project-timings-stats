import { Kysely, Generated, SqliteDialect } from "kysely";
import { createNodeSqliteDialect } from "./executor.ts";

// Database table interfaces
export interface ClientTable {
  id: Generated<bigint>;
  name: string;
}

export interface ProjectTable {
  id: Generated<bigint>;
  name: string;
  clientId: number;
}

export interface TimingTable {
  id: Generated<bigint>;
  start: number; // Unix timestamp in milliseconds (INTEGER
  end: number; // Unix timestamp in milliseconds (INTEGER )
  projectId: number;
}

export interface SummaryTable {
  id: Generated<bigint>;
  archived: number;
  start: number; // Unix timestamp in milliseconds (INTEGER
  end: number; // Unix timestamp in milliseconds (INTEGER)
  text: string;
  projectId: number;
}

// Views
export interface DailySummariesView {
  day: string;
  summary: string;
  client: string;
  project: string;
  projectId: number;
}

export interface DailyTotalsView {
  day: string;
  hours: number;
  client: string;
  project: string;
  projectId: number;
}

// Database interface
export interface Database {
  client: ClientTable;
  project: ProjectTable;
  timing: TimingTable;
  summary: SummaryTable;
  dailySummaries: DailySummariesView;
  dailyTotals: DailyTotalsView;
}

const TIMINGS_DB = Deno.env.get("TIMINGS_DB") || "./_data/timings.db";

// Create and export the database instance
export const db = new Kysely<Database>({
  dialect: createNodeSqliteDialect(TIMINGS_DB),
});
