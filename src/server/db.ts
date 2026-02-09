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

const TIMINGS_DB = ["timings.db", "./_data/timings.db"].find((path) => {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
});

if (!TIMINGS_DB) {
  throw new Error(
    "No database file found. Please create a timings.db file in the _data directory or the project root.",
  );
} else {
  console.log(`Using database file: ${TIMINGS_DB}`);
}

// Create and export the database instance
export const db = new Kysely<Database>({
  dialect: createNodeSqliteDialect(TIMINGS_DB),
});
