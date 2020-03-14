import { fetchArticle, fetchArticleMHs, fetchUser } from "./matters-graphq-api";
import { db } from "./db";
import { sleep } from "../utils";
import { SpiderState, UserId } from "../data-types";

const state: SpiderState = {
    type: "spider-state",
    entityId: "spider-state",
    cursor: "",
    mhsToFetch: [],
    userIdsToFetch: [],
};

async function articleFiller() {
    while (true) {
        await sleep(10000);
        console.info(`Filler: ${state.mhsToFetch.length} hashes to fetch`);
        let result = await fetchArticleMHs(100, "newest");
        if (state.cursor) {
            result = await fetchArticleMHs(100, "newest", state.cursor);
        }
        state.cursor = result.lastCursor;
        if (!result.mhs.length) {
            await sleep(60 * 1000)
        }
        for (const mh of result.mhs) {
            if (!await db.article.exists(mh)) {
                state.mhsToFetch.push(mh);
            }
        }
        await db.spiderRecord.saveSpiderState(state);
    }
}

async function supplyUsersToFetch(mentionedUsers: UserId[]) {
    for (const userId of mentionedUsers) {
        if (!await db.user.exists(userId) && !state.userIdsToFetch.includes(userId)) {
            state.userIdsToFetch.push(userId);
        }
    }
}

async function articleFetcher(name: string) {
    while (true) {
        await sleep(1000);
        const nextMediaHash = state.mhsToFetch[0];
        state.mhsToFetch.splice(0, 1);
        if (!nextMediaHash) {
            continue
        }
        console.info(`Article fetcher ${name} fetching`, nextMediaHash);
        const now = Date.now();
        const data = await fetchArticle(nextMediaHash);
        if (data) {
            const { article, comments, transactions, mentionedUsers } = data;
            await db.spiderRecord.upsert({
                entityId: article.mediaHash,
                type: "article",
                lastFetch: now,
            });
            await db.article.upsert(article);
            for (const tx of transactions) {
                await db.transaction.upsert(tx)
            }
            for (const comment of comments) {
                await db.comment.upsert(comment)
            }

            await supplyUsersToFetch(mentionedUsers);
        }
    }
}

async function userFetcher(name: string) {
    while (true) {
        await sleep(1000);
        const nextId = state.userIdsToFetch[0];
        state.userIdsToFetch.splice(0, 1);
        if (!nextId) {
            continue
        }
        console.info(`User fetcher ${name} fetching`, nextId);
        const now = Date.now();
        const data = await fetchUser(nextId);
        if (data) {
            const {user, mentionedUsers} = data;
            await db.spiderRecord.upsert({
                entityId: user.id,
                type: "user",
                lastFetch: now,
            });
            await db.user.upsert(user);

            await supplyUsersToFetch(mentionedUsers);
        }
    }
}


function parallel(worker: (name: string) => Promise<void>, count: number): Promise<void>[] {
    return Array.from(Array(count)).map((_, index) => worker(index.toString()))
}

async function main() {
    await db.connect();
    await db.setup();

    const spiderState = await db.spiderRecord.loadSpiderState();
    if (spiderState) {
        console.info("loaded", spiderState.cursor, spiderState.mhsToFetch.length);
        state.mhsToFetch = spiderState.mhsToFetch;
        state.cursor = spiderState.cursor;
    }

    await Promise.all([
        articleFiller(),
        ...parallel(articleFetcher, 2),
        ...parallel(userFetcher, 2),
    ]);
    await db.close();
}

!!main();
