import { db } from './db.ts';


export async function getDailySummariesWithTotals(input: { from?: Date; to?: Date, client?: string; project?: string }) {
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
        .selectFrom('dailySummaries')
        .selectAll()
        .where('day', '>=', from)
        .where('day', '<=', to);

    let totalsQuery = db
        .selectFrom('dailyTotals')
        .selectAll()
        .where('day', '>=', from)
        .where('day', '<=', to);

    if (input.client) {
        summariesQuery = summariesQuery.where('client', 'like', `%${input.client}%`);
        totalsQuery = totalsQuery.where('client', 'like', `%${input.client}%`);
    }

    if (input.project) {
        summariesQuery = summariesQuery.where('project', 'like', `%${input.project}%`);
        totalsQuery = totalsQuery.where('project', 'like', `%${input.project}%`);
    }

    const start = performance.now();
    const [summaries, totals] = await Promise.all([
        summariesQuery.execute(),
        totalsQuery.execute()
    ]);
    const end = performance.now();
    console.log(`Queries took ${end - start} ms`);

    // Create a map of summaries by day-project key
    const summariesMap = new Map(
        summaries.map(s => [`${s.day}-${s.projectId}`, s])
    );

    // Use totals as the base and merge summaries where available
    return totals.map(total => {
        const summary = summariesMap.get(`${total.day}-${total.projectId}`);
        return {
            day: total.day,
            project: summary?.project ?? total.project,
            client: summary?.client ?? total.client,
            summary: summary?.summary ?? "",
            total: total.hours
        };
    });
}