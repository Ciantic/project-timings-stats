import { db } from "./db.ts";

export async function getDailySummariesWithTotals(input: {
  from?: Date;
  to?: Date;
  client?: string;
  project?: string;
}) {
  "use server";

  const from = input?.from?.toISOString().substring(0, 10);
  let to = input?.to?.toISOString().substring(0, 10);

  if (!from) {
    return [];
  }

  if (!to) {
    to = from;
  }

  let summariesQuery = db
    .selectFrom("dailySummaries")
    .selectAll()
    .where("day", ">=", from)
    .where("day", "<=", to);

  let totalsQuery = db
    .selectFrom("dailyTotals")
    .selectAll()
    .where("day", ">=", from)
    .where("day", "<=", to);

  if (input.client) {
    summariesQuery = summariesQuery.where(
      "client",
      "like",
      `%${input.client}%`,
    );
    totalsQuery = totalsQuery.where("client", "like", `%${input.client}%`);
  }

  if (input.project) {
    summariesQuery = summariesQuery.where(
      "project",
      "like",
      `%${input.project}%`,
    );
    totalsQuery = totalsQuery.where("project", "like", `%${input.project}%`);
  }

  const start = performance.now();
  const [summaries, totals] = await Promise.all([
    summariesQuery.execute(),
    totalsQuery.execute(),
  ]);
  const end = performance.now();
  // console.log(`Queries took ${end - start} ms`);

  // Create a map of summaries by day-project key
  const summariesMap = new Map(
    summaries.map((s) => [`${s.day}-${s.projectId}`, s]),
  );

  // Use totals as the base and merge summaries where available
  return totals.map((total) => {
    const summary = summariesMap.get(`${total.day}-${total.projectId}`);
    return {
      day: total.day,
      project: summary?.project ?? total.project,
      client: summary?.client ?? total.client,
      summary: summary?.summary ?? "",
      total: total.hours,
    };
  });
}

export async function updateSummary(input: {
  day: Date;
  client: string;
  project: string;
  summary: string;
}) {
  "use server";


  // Find the project ID based on client and project names
  const projectRecord = await db
    .selectFrom("project")
    .innerJoin("client", "client.id", "project.clientId")
    .select("project.id")
    .where("client.name", "=", input.client)
    .where("project.name", "=", input.project)
    .executeTakeFirst();

  if (!projectRecord) {
    throw new Error(`Project not found: ${input.client} - ${input.project}`);
  }

  const projectId = Number(projectRecord.id);

  // Calculate the start and end timestamps for the day (in milliseconds)
  const startOfDay = new Date(input.day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(input.day);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setHours(0, 0, 0, 0);

  const startTimestamp = startOfDay.getTime();
  const endTimestamp = endOfDay.getTime();

  if (!input.summary || input.summary.trim() === "") {
    // Delete the summary from the database
    await db
      .deleteFrom("summary")
      .where("start", "=", startTimestamp)
      .where("projectId", "=", projectId)
      .execute();
    
    return { success: true };
  }

  await db
    .insertInto("summary")
    .values({
      start: startTimestamp,
      end: endTimestamp,
      text: input.summary.trim(),
      projectId: projectId,
      archived: 0,
    })
    .onConflict((oc) =>
      oc.columns(["projectId", "start", "end"]).doUpdateSet({
        text: (eb) => eb.ref("excluded.text"),
        archived: (eb) => eb.ref("excluded.archived"),
      })
    ).execute();

  return { success: true };
}

export async function keepAlive() {
  "use server";
  return "OK";
}
