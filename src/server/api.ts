import { db } from './db.ts';


export async function getDailySummariesWithTotals(input: { from: string; to: string, client?: string; project?: string }) {
    "use server";

    let summariesQuery = db
        .selectFrom('dailySummaries')
        .selectAll()
        .where('day', '>=', input.from)
        .where('day', '<=', input.to);

    let totalsQuery = db
        .selectFrom('dailyTotals')
        .selectAll()
        .where('day', '>=', input.from)
        .where('day', '<=', input.to);

    if (input.client) {
        summariesQuery = summariesQuery.where('client', 'like', `%${input.client}%`);
        totalsQuery = totalsQuery.where('client', 'like', `%${input.client}%`);
    }

    if (input.project) {
        summariesQuery = summariesQuery.where('project', 'like', `%${input.project}%`);
        totalsQuery = totalsQuery.where('project', 'like', `%${input.project}%`);
    }

    const [summaries, totals] = await Promise.all([
        summariesQuery.execute(),
        totalsQuery.execute()
    ]);

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