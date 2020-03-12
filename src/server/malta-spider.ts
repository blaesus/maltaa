import { fetchArticle, fetchNewest } from "./matters-graphq-api";
import { db } from "./db";

async function main() {
    await db.connect();
    await db.setup();
    const result = await fetchNewest(10);
    for (const summary of result.summaries) {
        const result = await fetchArticle(summary.mediaHash);
        if (result) {
            await db.upsertArticle(result);
        }
    }
    console.info(result);
}

!!main();
