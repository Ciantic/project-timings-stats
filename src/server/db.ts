import { Kysely } from 'kysely';
import { createNodeSqliteDialect } from './executor.ts';

// Database table interfaces
export interface ClientTable {
  id: number;
  name: string;
}

export interface ProjectTable {
  id: number;
  name: string;
  clientId: number;
}

export interface TimingTable {
  id: number;
  start: number;
  end: number;
  projectId: number;
}

export interface SummaryTable {
  id: number;
  archived: boolean;
  start: number;
  end: number;
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

// Create and export the database instance
export const db = new Kysely<Database>({
  dialect: createNodeSqliteDialect('./_data/timings.db'),
});
