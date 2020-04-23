import * as Koa from "koa";
import * as KoaLogger from "koa-logger";
import * as KoaBody from "koa-body";
import * as KoaRouter from "koa-router";

import { ArticleId } from "../definitions/Article";
import { EntityState, SpiderState } from "../definitions/Spider";
import { UserId } from "../definitions/User";
import {
    ArticleQueryMode,
    fetchArticle,
    fetchArticleIds, fetchComment,
    fetchTag,
    fetchUser,
} from "./matters-graphq-api";

import { db } from "./db";

import {
    articleIdToSerial,
    articleSerialToId, commentIdToSerial, commentSerialToId, tagIdToSerial,
    tagSerialToId,
    userIdToSerial,
    userSerialToId,
} from "../mattersSpecifics";
import {atob, btoa} from "./serverUtils"
import { SPIDER_COMMAND_PORT } from "./server-configs";
import {DAY, dedupe, HOUR, MINUTE, promiseWithTimeout, range, SECOND, sleep} from "../utils";

const NEWEST_ARTICLE_INDEXER_INTERVAL = 10 * SECOND;
const NEWEST_ARTICLE_INDEXER_INTERVAL_AFTER_EXHAUSTION = 60 * SECOND;
const OBSOLETE_INDEXER_CHECK_INTERVAL = 60 * SECOND;
const ITEM_VALIDITY = 7 * DAY;

const FETCHER_INTERVAL = SECOND;

const SERIAL_INDEXER_BACKOFF = 60 * MINUTE;

const DAILY_NEWEST_RANGE = 24 * HOUR;
const DAILY_INDEXER_INTERVAL = 30 * MINUTE;
const DAILY_NEW_ARTICLE_STALE_LIMIT = 60 * MINUTE;

const WEEKLY_NEWEST_RANGE = 7 * DAY;
const WEEKLY_INDEXER_INTERVAL = 12 * HOUR;
const WEEKLY_NEW_ARTICLE_STALE_LIMIT = 24 * HOUR;

const DOWNLOAD_TIMEOUT = 20 * SECOND;

function makeEmptyEntityState(): EntityState<string> {
    return {
        toFetch: [],
        fetching: [],
        missingOnRemote: [],
        lastCheckedSerial: 1,
    }
}

const state: SpiderState = {
    type: "spider-state",
    entityId: "spider-state",
    articles: {
        ...makeEmptyEntityState(),
        cursor: null,
    },
    users: makeEmptyEntityState(),
    tags: makeEmptyEntityState(),
    comments: makeEmptyEntityState(),
};

async function isArticleEncountered(id: ArticleId): Promise<boolean> {
    return state.articles.toFetch.includes(id)
     || state.articles.fetching.includes(id)
     || await db.article.exists(id);
}

async function allArticlesEncountered(ids: ArticleId[]): Promise<boolean> {
    for (const id of ids) {
        if (!(await isArticleEncountered(id))) {
            return false;
        }
    }
    return true;
}

function supplyIds<IdType extends string>(ids: IdType[], entityState: EntityState<IdType>, priority = false) {
    for (const id of ids) {
        if (!entityState.toFetch.includes(id) && !entityState.fetching.includes(id)) {
            if (priority) {
                entityState.toFetch.unshift(id);
            }
            else {
                entityState.toFetch.push(id);
            }
        }
    }
}

async function asyncLoop(backoff: number, f: () => Promise<any>) {
    while (true) {
        await sleep(backoff);
        try {
            await f();
        }
        catch (error) {
            console.error(error)
        }
    }
}

async function newestArticleIndexer() {
    console.info(`Newest article indexer launched`);
    const mode: ArticleQueryMode = "newest";
    const listLength = 10;
    await asyncLoop(NEWEST_ARTICLE_INDEXER_INTERVAL, async () => {
        let result = await fetchArticleIds(listLength, mode, state.articles.cursor);
        console.info(`Newest article indexer: found ${result.ids.length} new ids after cursor ${state.articles.cursor} - the first is ${result.ids[0]}`);
        state.articles.cursor = result.lastCursor;

        const noNewArticles = await allArticlesEncountered(result.ids);
        if (noNewArticles) {
            console.info("Newest article indexer: exhausted; starting again...");
            state.articles.cursor = null;
            await sleep(NEWEST_ARTICLE_INDEXER_INTERVAL_AFTER_EXHAUSTION);
        }
        else {
            supplyIds(result.ids, state.articles, true);
        }
    })
}


function makeRecentArticleReindexer(props: {
    name: string,
    backoff: number,
    newestRange: number,
    staleLimit: number,
}) {
    const {name, backoff, newestRange, staleLimit} = props;
    return async function reIndexer() {
        console.info(`${name} re-indexer launched`);
        await asyncLoop(backoff, async () => {
            const now = Date.now();
            const cutoff = now - newestRange;
            const articles = await db.article.internal.findCreatedAfter(cutoff);
            for (const article of articles) {
                const spiderRecord = await db.spiderRecord.findByEntityId(article.id);
                if (spiderRecord && spiderRecord.type === "article") {
                    const isStale = now - spiderRecord.lastFetch > staleLimit;
                    if (isStale) {
                        supplyIds([article.id], state.articles, true);
                    }
                }
            }
        })
    }
}

const dailyRecentArticleReindexer = makeRecentArticleReindexer({
    name: "daily",
    backoff: DAILY_INDEXER_INTERVAL,
    newestRange: DAILY_NEWEST_RANGE,
    staleLimit: DAILY_NEW_ARTICLE_STALE_LIMIT,
})

const weeklyRecentArticleReindexer = makeRecentArticleReindexer({
    name: "weekly",
    backoff: WEEKLY_INDEXER_INTERVAL,
    newestRange: WEEKLY_NEWEST_RANGE,
    staleLimit: WEEKLY_NEW_ARTICLE_STALE_LIMIT,
})

function makeSerialIndexer<IdType extends string>(props: {
    entityName: string,
    getIds(): Promise<IdType[]>,
    idToSerial(id: IdType, atob: (s: string) => string): number,
    serialToId(serial: number, btoa: (s: string) => string): IdType,
    entityState: EntityState<IdType>,
    exists(id: string): Promise<boolean>,
    backoff?: number,
}) {
    const backoff = props.backoff || SERIAL_INDEXER_BACKOFF;
    return async function serialArticleIndexer() {
        console.info(`Serial ${props.entityName} indexer launched`);
        await asyncLoop(backoff, async () => {
            const currentIds = await props.getIds();
            const currentSerials = currentIds.map(id => props.idToSerial(id, atob));
            const max = currentSerials.sort((a, b) => b - a)[0];
            const min = props.entityState.lastCheckedSerial + 1;
            if (max <= min) {
                return;
            }
            const allSerialsInRange = range({min, max});
            let idsToDownload = [];
            for (const serial of allSerialsInRange) {
                const id = props.serialToId(serial, btoa);
                if (
                    !props.entityState.toFetch.includes(id)
                    && !props.entityState.fetching.includes(id)
                    && !props.entityState.missingOnRemote.includes(id)
                    && !(await props.exists(id))
                ) {
                    idsToDownload.push(id)
                }
            }
            console.info(`Serial ${props.entityName} indexer: adding`, idsToDownload);
            props.entityState.toFetch = [
                ...props.entityState.toFetch,
                ...idsToDownload,
            ];
            props.entityState.lastCheckedSerial = max;
        })
    }
}

const serialArticleIndexer = makeSerialIndexer({
    entityName: "article",
    entityState: state.articles,
    getIds: db.article.getAllIds,
    exists: db.article.exists,
    idToSerial: articleIdToSerial,
    serialToId: articleSerialToId,
});

const serialUserIndexer = makeSerialIndexer({
    entityName: "user",
    entityState: state.users,
    getIds: db.user.getAllIds,
    exists: db.user.exists,
    idToSerial: userIdToSerial,
    serialToId: userSerialToId,
});

const serialTagIndexer = makeSerialIndexer({
    entityName: "tag",
    entityState: state.tags,
    getIds: db.tag.getAllIds,
    exists: db.tag.exists,
    idToSerial: tagIdToSerial,
    serialToId: tagSerialToId,
});

const serialCommentIndexer = makeSerialIndexer({
    entityName: "comment",
    entityState: state.comments,
    getIds: db.comment.getAllIds,
    exists: db.comment.exists,
    idToSerial: commentIdToSerial,
    serialToId: commentSerialToId,
});

async function obsoleteIndexer() {
    console.info("Obsolete indexer launched");
    await asyncLoop(OBSOLETE_INDEXER_CHECK_INTERVAL, async () => {
        const latestAllowed = Date.now() - ITEM_VALIDITY;
        const records = await db.spiderRecord.findBefore(latestAllowed);

        const articleRecords = records.filter(r => r.type === "article");
        const tagRecords = records.filter(r => r.type === "tag");
        const userRecords = records.filter(r => r.type === "user");

        const articleIds = articleRecords.map(r => r.entityId);
        const tagIds = tagRecords.map(r => r.entityId);
        const userIds = userRecords.map(r => r.entityId);

        supplyIds(articleIds, state.articles);
        supplyIds(tagIds, state.tags);
        supplyIds(userIds, state.users);
    });
}

async function downloadArticle(
    nextId: ArticleId,
    downloadMentionedEntities = false,
) {
    const now = Date.now();
    const data = await fetchArticle(nextId);
    await db.spiderRecord.upsert({
        entityId: nextId,
        type: "article",
        lastFetch: now,
        success: !!data,
    });
    if (data) {
        const { entity, comments, transactions, mentionedUsers } = data;
        await db.article.upsert(entity);
        for (const tx of transactions) {
            await db.transaction.upsert(tx)
        }
        for (const comment of comments) {
            await db.comment.upsert(comment)
        }

        if (downloadMentionedEntities) {
            supplyIds(mentionedUsers, state.users, true);
            supplyIds(entity.tags, state.tags, true);
        }
    }
    else {
        throw Error(`Article fetch failed ${nextId}`);
    }
}

function makeFetcher(props: {
    entityName: string,
    entityState: EntityState<string>,
    download: (id: string, downloadMentioned?: boolean) => Promise<any>,
    downloadMentioned: boolean,
}) {
    const {entityName, entityState, download, downloadMentioned} = props;
    return async function fetcher(fetcherName: string) {
        console.info(`${entityName} fetcher ${fetcherName} launched`);
        await asyncLoop(FETCHER_INTERVAL, async () => {
            const nextId = entityState.toFetch[0];
            entityState.toFetch.splice(0, 1);
            if (!nextId) {
                return;
            }
            console.info(`${entityName} fetcher ${fetcherName} fetching`, nextId);
            entityState.fetching.push(nextId);
            try {
                await promiseWithTimeout(DOWNLOAD_TIMEOUT, download(nextId, downloadMentioned));
                console.info(`${entityName} fetch successfully fetched ${nextId}`);
                entityState.fetching = entityState.fetching.filter(id => id !== nextId);
            }
            catch (error) {
                console.error(`${entityName} fetcher ${fetcherName} failed to fetch ${nextId}: ${error}`);
                entityState.fetching = entityState.fetching.filter(id => id !== nextId);
                supplyIds([nextId], entityState);
            }
        })
    }
}

const articleFetcher = makeFetcher({
    entityName: "article",
    entityState: state.articles,
    download: downloadArticle,
    downloadMentioned: true,
})

async function downloadUser(
    nextId: UserId,
    downloadMentionedEntities = false,
) {
    const now = Date.now();
    const data = await fetchUser(nextId);
    await db.spiderRecord.upsert({
        entityId: nextId,
        type: "user",
        lastFetch: now,
        success: !!data,
    });
    if (data) {
        const {entity, mentionedUsers, mentionedArticles} = data;
        await db.user.upsert(entity);

        if (downloadMentionedEntities) {
            supplyIds(mentionedUsers, state.users);
            supplyIds(mentionedArticles, state.articles);
        }
    }
    else {
        throw Error(`User fetch failed ${nextId}`);
    }
}

const userFetcher = makeFetcher({
    entityName: "user",
    entityState: state.users,
    download: downloadUser,
    downloadMentioned: false,
});

const tagFetcher = makeFetcher({
    entityName: "tag",
    entityState: state.tags,
    download: downloadTag,
    downloadMentioned: false,
});

const commentFetcher = makeFetcher({
    entityName: "comment",
    entityState: state.comments,
    download: downloadComment,
    downloadMentioned: false,
});

async function downloadComment(nextId: string) {
    const now = Date.now();
    const data = await fetchComment(nextId);
    await db.spiderRecord.upsert({
        entityId: nextId,
        type: "comment",
        lastFetch: now,
        success: !!data,
    });
    if (data) {
        const comment = data.entity;
        await db.comment.upsert(comment);
    }
    else {
        state.tags.missingOnRemote.push(nextId);
    }
}

async function downloadTag(nextId: string) {
    const now = Date.now();
    const data = await fetchTag(nextId);
    await db.spiderRecord.upsert({
        entityId: nextId,
        type: "tag",
        lastFetch: now,
        success: !!data,
    });
    if (data) {
        const tag = data.entity;
        await db.tag.upsert(tag);
    }
    else {
        state.tags.missingOnRemote.push(nextId);
    }
}

function parallel(worker: (name: string) => Promise<void>, count: number): Promise<void>[] {
    return Array.from(Array(count)).map((_, index) => worker(index.toString()))
}

async function crawl() {
    setInterval(() => {
        reportState(state);
        saveSpiderState(state);
    }, 60 * 1000);
    await Promise.all([
        newestArticleIndexer(),
        dailyRecentArticleReindexer(),
        weeklyRecentArticleReindexer(),
        serialArticleIndexer(),
        serialUserIndexer(),
        serialTagIndexer(),
        serialCommentIndexer(),
        obsoleteIndexer(),
        ...parallel(articleFetcher, 4),
        ...parallel(userFetcher, 6),
        ...parallel(tagFetcher, 6),
        ...parallel(commentFetcher, 2),
    ]);
}

function reportState(spiderState: SpiderState) {
    console.info(`
*****
Spider state ${new Date()}
Article cursor at ${spiderState.articles.cursor}
articles to download: ${spiderState.articles.toFetch.length} (serial at ${spiderState.articles.lastCheckedSerial})
users to download ${spiderState.users.toFetch.length} (serial at ${spiderState.users.lastCheckedSerial})
tags to download ${spiderState.tags.toFetch.length} (serial at ${spiderState.tags.lastCheckedSerial})
*****
`);
}

async function restoreSpiderState() {
    const loadedState = await db.spiderRecord.loadSpiderState();
    if (loadedState) {
        state.articles.toFetch = [...loadedState.articles.toFetch,...loadedState.articles.fetching].filter(dedupe).filter(Boolean);
        state.users.toFetch = [...loadedState.users.toFetch, ...loadedState.users.fetching].filter(dedupe).filter(Boolean);
        state.tags.toFetch = [...loadedState.tags.toFetch, ...loadedState.tags.fetching].filter(dedupe).filter(Boolean);
        state.comments.toFetch = [...loadedState.comments?.toFetch, ...loadedState.comments?.fetching].filter(dedupe).filter(Boolean);

        state.articles.missingOnRemote = loadedState.articles.missingOnRemote.filter(dedupe).filter(Boolean);
        state.users.missingOnRemote = loadedState.users.missingOnRemote.filter(dedupe).filter(Boolean);
        state.tags.missingOnRemote = loadedState.tags.missingOnRemote.filter(dedupe).filter(Boolean);
        state.comments.missingOnRemote = loadedState.comments?.missingOnRemote.filter(dedupe).filter(Boolean);

        state.articles.lastCheckedSerial = loadedState.articles.lastCheckedSerial || 0;
        state.users.lastCheckedSerial = loadedState.users.lastCheckedSerial || 0;
        state.tags.lastCheckedSerial = loadedState.tags.lastCheckedSerial || 0;
        state.comments.lastCheckedSerial = loadedState.comments?.lastCheckedSerial || 0;

        state.articles.cursor = loadedState.articles.cursor;
    }
}

async function saveSpiderState(state: SpiderState) {
    return db.spiderRecord.saveSpiderState(state);
}

function launchCommandServer() {
    const app = new Koa();
    app.proxy = true;
    app.use(KoaLogger());
    app.use(KoaBody());
    const router = new KoaRouter();
    router.prefix("/api/spider");
    router.get("/", async (context, next) => {
        context.body = 200;
        context.body = state;
        return next();
    });
    router.post("/articles/:id", async (context, next) => {
        const id = context.params.id;
        supplyIds([id], state.articles, true);
        context.body = 201;
        context.body = {};
        return next();
    });
    router.delete("/articles/", async (context, next) => {
        state.articles.toFetch = [];
        context.body = 200;
        context.body = {};
        return next();
    });
    router.post("/users/:id", async (context, next) => {
        const id = context.params.id;
        supplyIds([id], state.users, true);
        context.body = 201;
        context.body = {};
        return next();
    });
    router.delete("/users/", async (context, next) => {
        state.users.toFetch = [];
        context.body = 200;
        context.body = {};
        return next();
    });

    router.post("/tags/:id", async (context, next) => {
        const id = context.params.id;
        supplyIds([id], state.tags, true);
        context.body = {
            id,
        };
        return next();
    });
    router.delete("/tags/", async (context, next) => {
        state.tags.toFetch = [];
        context.body = 200;
        context.body = {};
        return next();
    });

    app.use(router.routes())
       .use(router.allowedMethods());
    app.listen(SPIDER_COMMAND_PORT);
    console.log(`Maltaa spider command server running at ${SPIDER_COMMAND_PORT}`);
}

async function launchSpider() {
    await db.connect();
    await db.setupCollections();
    await restoreSpiderState();
    reportState(state);
    launchCommandServer();

    process.on('SIGINT', async (code) => {
        await saveSpiderState(state);
        console.log('Process exit event with code: ', code);
    });
    await crawl();
    await db.close();
}

if (require.main === module) {
    !!launchSpider();
}


