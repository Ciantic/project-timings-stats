import { db } from './db.ts';

export async function getDailySummaries(input: { from: string; to: string, client?: string; project?: string }) {
    "use server";

    let query = db
        .selectFrom('dailySummaries')
        .selectAll()
        .where('day', '>=', input.from)
        .where('day', '<=', input.to);

    if (input.client) {
        query = query.where('client', '=', input.client);
    }

    if (input.project) {
        query = query.where('project', '=', input.project);
    }

    return query.execute();
}