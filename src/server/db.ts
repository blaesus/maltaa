import { Db, MongoClient } from "mongodb";

import { AuthToken, AuthTokenId } from "../definitions/AuthToken";
import { Assortment, AssortmentId, AssortmentIdentifier } from "../definitions/Assortment";
import { Activity } from "../definitions/Activity";
import { Article, ArticleId, Comment, CommentId, IPFSHash, IPFSRendering } from "../definitions/Article";
import { Transaction, TransactionMaltaaId } from "../definitions/Transaction";
import { UserId, UserPublic } from "../definitions/User";
import { SpiderRecord, SpiderRecordEntity, SpiderState } from "../definitions/Spider";
import { SiteConfig } from "../definitions/SiteConfig";
import { Tag, TagId } from "../definitions/Tag";
import { AccountId, MaltaaAccount } from "../definitions/MaltaaAccount";
import { isLegalAssortment } from "../rules";
import { DataStatus } from "../definitions/DataStatus";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 32;

const mainDBName = "maltaa";
const mattersSyncDBName = "maltaaMattersSync";
const activityDBName = "maltaaActivity";

let client: MongoClient | null = null;

let mainDB: Db | null = null;
let mattersSyncDB: Db | null = null;
let activityDB: Db | null = null;

const fallbackDataStatus: DataStatus = {
    appliedMigrations: {},
}

interface FilterConditions {
    earliest?: number,
    latest?: number,
    author?: UserId | null,
}

interface ListQueryInternalParams extends FilterConditions {
    sortConditions: {},
    pageNumber: number,
    pageSize: number,
}

const fallbackParams: SortedArticleQueryParams = {
    pageNumber: 0,
}

function constructQuery(conditions: FilterConditions): any {
    const {earliest, latest, author} = conditions;
    const activeQuery = {state: "active"};
    const earliestCondition = {$gt: earliest};
    const latestCondition = {$lt: latest};

    let query: any = {...activeQuery};

    if (earliest && latest) {
        query = {
            $and: [
                activeQuery,
                {createdAt: earliestCondition},
                {createdAt: latestCondition},
            ],
        };
    }
    else if (earliest) {
        query.createdAt = earliestCondition;
    }
    else if (latest) {
        query.createdAt = latestCondition;
    }

    if (author) {
        query.author = author;
    }

    return query;
}

async function findActive<T>(
    collection: "articles" | "comments",
    params: ListQueryInternalParams
): Promise<T[]> {
    const {sortConditions, pageNumber, pageSize} = params;
    if (mattersSyncDB) {
        const query = constructQuery(params);

        return mattersSyncDB.collection(collection)
                            .find(query)
                            .sort(sortConditions)
                            .skip(pageNumber * pageSize)
                            .limit(pageSize)
                            .project(skipInternalId)
                            .toArray();
    }
    else {
        return [];
    }
}

export interface SortedArticleQueryParams {
    pageNumber: number,
    earliest?: number,
    latest?: number,
    pageSize?: number,
    author?: UserId | null,
}

function paramsConvert(sortConditions: {}, params: SortedArticleQueryParams): ListQueryInternalParams {
    return {
        sortConditions,
        pageNumber: params.pageNumber,
        pageSize: Math.min(params.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
        earliest: params.earliest,
        latest: params.latest,
        author: params.author,
    };
}

const skipInternalId = {_id: 0};

const mongodb = {
    async connect() {
        const url = "mongodb://localhost:27017";
        client = new MongoClient(url, {
            useUnifiedTopology: true,
        });
        await client.connect();
        mainDB = client.db(mainDBName);
        activityDB = client.db(activityDBName);
        mattersSyncDB = client.db(mattersSyncDBName);
    },
    async setupCollections() {
        if (mainDB) {
            {
                await mainDB.createIndex("accounts", {id: 1}, {unique: true});
                await mainDB.createIndex("accounts", {
                    "matters.id": 1,
                });
            }
            {
                await mainDB.createIndex("tokens", {id: 1}, {unique: true});
            }
            {
                await mainDB.createIndex("assortments", {id: 1}, {unique: true});
                await mainDB.createIndex("assortments", {
                    subpath: 1,
                    owner: 1,
                    contentType: 1,
                }, {unique: true});
                await mainDB.createIndex("assortments", {editors: 1});
                await mainDB.createIndex("assortments", {upstreams: 1});
                await mainDB.createIndex("assortments", {"items.id": 1});
            }
        }
        if (mattersSyncDB) {
            {
                await mattersSyncDB.createIndex("articles", {id: 1}, {unique: true});
                await mattersSyncDB.createIndex("articles", {mediaHash: 1});
                await mattersSyncDB.createIndex("articles", {
                    createdAt: 1,
                    author: 1,
                    upstreams: 1,
                    state: 1,
                    "derived.comments": 1,
                    "derived.commenters": 1,
                    "derived.appreciations": 1,
                    "derived.appreciationAmount": 1,
                }, {
                    name: "article-cursor",
                });
            }
            {
                await mattersSyncDB.createIndex("spiderRecords", {entityId: 1, type: 1}, {unique: true});
                await mattersSyncDB.createIndex("spiderRecords", {lastFetch: 1});
            }
            {
                await mattersSyncDB.createIndex("users", {
                    id: 1,
                    userName: 1,
                }, {unique: true});
            }
            {
                await mattersSyncDB.createIndex("comments", {id: 1}, {unique: true});
                await mattersSyncDB.createIndex("comments", {
                    parent: 1,
                    state: 1,
                    createdAt: 1,
                    "derived.upvotes": 1,
                    "derived.root": 1,
                });
            }
            {
                await mattersSyncDB.createIndex("transactions", {mid: 1}, {unique: true});
                await mattersSyncDB.createIndex("transactions", {target: 1});
                await mattersSyncDB.createIndex("transactions", {createdAt: 1});
            }
            {
                await mattersSyncDB.createIndex("tags", {id: 1}, {unique: true});
            }
        }
        if (activityDB) {
            {
                await activityDB.createIndex("activities", {id: 1}, {unique: true});
            }
        }
    },
    article: {
        async upsert(article: Article) {
            return mattersSyncDB && await mattersSyncDB.collection("articles").replaceOne(
                {id: article.id},
                article,
                {upsert: true},
            );
        },
        async exists(id: string): Promise<boolean> {
            if (mattersSyncDB) {
                const existings = mattersSyncDB.collection("articles").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findActiveById(id: string): Promise<Article | null> {
            return mattersSyncDB && mattersSyncDB.collection("articles")
                                                 .findOne({id, state: "active"});
        },
        async findActiveByIds(ids: string[]): Promise<Article[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("articles")
                                    .find({id: {$in: ids}, state: "active"})
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByMHs(mhs: string[]): Promise<Article[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("articles")
                                    .find({mediaHash: {$in: mhs}, state: "active"})
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async findRandomActive(
            count: number = DEFAULT_PAGE_SIZE,
            conditions: FilterConditions = {},
        ): Promise<Article[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("articles")
                                    .aggregate([
                                        { $match: constructQuery(conditions) },
                                        { $sample: {size: count}},
                                    ])
                                    .project(skipInternalId)
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByUpstreams(id: string): Promise<Article[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("articles").find({upstreams: id, state: "active"}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<ArticleId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("articles")
                             .find()
                             .project({id: 1})
                             .map((article: Article) => article.id).toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByRecency(params = fallbackParams): Promise<Article[]> {
            return findActive<Article>("articles", paramsConvert({createdAt: -1}, params));
        },
        async findActiveByAge(params = fallbackParams): Promise<Article[]> {
            return findActive<Article>("articles", paramsConvert({createdAt: 1}, params));
        },
        async findActiveByComments(params = fallbackParams): Promise<Article[]> {
            return findActive<Article>("articles", paramsConvert({"derived.comments": -1}, params));
        },
        async findActiveByAppreciationAmount(params = fallbackParams): Promise<Article[]> {
            return findActive<Article>("articles", paramsConvert({"derived.appreciationAmount": -1}, params));
        },
        internal: {
            async findById(id: string): Promise<Article | null> {
                return mattersSyncDB && mattersSyncDB.collection("articles").findOne({id});
            },
            async findCreatedAfter(earliest: number): Promise<Article[]> {
                if (mattersSyncDB) {
                    return mattersSyncDB.collection("articles")
                                 .find({
                                     createdAt: {$gt: earliest},
                                 })
                                 .toArray();
                }
                else {
                    return [];
                }
            },
        },
    },
    transaction: {
        async upsert(transaction: Transaction) {
            return mattersSyncDB && await mattersSyncDB.collection("transactions").replaceOne(
                {mid: transaction.mid},
                transaction,
                {upsert: true},
            );
        },
        async findActiveByIds(ids: TransactionMaltaaId[]): Promise<Transaction[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("transactions")
                                    .find({mid: {$in: ids}})
                                    .project(skipInternalId)
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<{ mid: string }[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("transactions")
                             .find()
                             .project({mid: 1, ...skipInternalId})
                             // .map((tx: Transaction) => tx.mid)
                             .toArray();
            }
            else {
                return [];
            }
        },
        async findByTarget(target: string): Promise<Transaction[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("transactions").find({target}).toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(id: string) {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("transactions").deleteMany({
                    id,
                });
            }
            else {
                return [];
            }
        },
        internal: {
            async deleteByCreatedAt(createdAt: number) {
                if (mattersSyncDB) {
                    return mattersSyncDB.collection("transactions").deleteMany({
                        createdAt,
                    });
                }
                else {
                    return [];
                }
            },

            async upsertByMid(mid: string, transaction: Transaction) {
                return mattersSyncDB && await mattersSyncDB.collection("transactions").replaceOne(
                    {mid},
                    transaction,
                    {upsert: true},
                );
            },

            async findByMid(mid: TransactionMaltaaId): Promise<Transaction | null> {
                if (mattersSyncDB) {
                    return mattersSyncDB.collection("transactions")
                                        .findOne({mid}, {projection: skipInternalId})
                }
                else {
                    return null;
                }
            },
        }
    },
    comment: {
        async upsert(comment: Comment) {
            return mattersSyncDB && await mattersSyncDB.collection("comments").replaceOne(
                {id: comment.id},
                comment,
                {upsert: true},
            );
        },
        async exists(id: CommentId): Promise<boolean> {
            if (mattersSyncDB) {
                const existings = mattersSyncDB.collection("comments").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findActiveByIds(ids: CommentId[]): Promise<Comment[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments")
                                    .find({
                                        id: {$in: ids},
                                        state: "active",
                                    })
                                    .project(skipInternalId)
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async findByParent(parent: ArticleId | CommentId): Promise<Comment[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments").find({parent}).toArray();
            }
            else {
                return [];
            }
        },
        async findByParents(parents: (ArticleId | CommentId)[]): Promise<Comment[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments").find({parent: {$in: parents}}).toArray();
            }
            else {
                return [];
            }
        },
        async findByRoot(root: ArticleId): Promise<Comment[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments")
                                    .find({"derived.root": root})
                                    .project(skipInternalId)
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<UserId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments")
                             .find()
                             .project({id: 1, ...skipInternalId})
                             .map((comment: Comment) => comment.id)
                             .toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(id: string) {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments").deleteMany({
                    id,
                });
            }
            else {
                return [];
            }
        },
        async findActiveByRecency(params = fallbackParams): Promise<Comment[]> {
            return findActive<Comment>("comments", paramsConvert({createdAt: -1}, params));
        },
        async findActiveByAge(params = fallbackParams): Promise<Comment[]> {
            return findActive<Comment>("comments", paramsConvert({createdAt: 1}, params));
        },
        internal: {
            async findByIds(ids: TransactionMaltaaId[]): Promise<Comment[]> {
                if (mattersSyncDB) {
                    return mattersSyncDB.collection("comments").find({id: {$in: ids}}).toArray();
                }
                else {
                    return [];
                }
            },
            async getAllIds(): Promise<UserId[]> {
                if (mattersSyncDB) {
                    return mattersSyncDB.collection("comments").find()
                                        .project({id: 1})
                                        .map((comment: Comment) => comment.id)
                                        .toArray();
                }
                else {
                    return [];
                }
            },
        },
    },
    user: {
        async upsert(user: UserPublic) {
            return mattersSyncDB && await mattersSyncDB.collection("users").replaceOne(
                {id: user.id},
                user,
                {upsert: true},
            );
        },
        async exists(id: UserId): Promise<boolean> {
            if (mattersSyncDB) {
                const existings = mattersSyncDB.collection("users").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findByIds(ids: UserId[]): Promise<UserPublic[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("users")
                                    .find({id: {$in: ids}})
                                    .project(skipInternalId)
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async findByUserName(userName: UserId): Promise<UserPublic | null> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("users")
                                    .findOne({userName}, {projection: skipInternalId})
                    ;
            }
            else {
                return null;
            }
        },
        async getAllIds(): Promise<UserId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("users").find()
                                    .project({id: 1})
                                    .map((user: UserPublic) => user.id)
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(id: string) {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("users").deleteMany({
                    id,
                });
            }
            else {
                return [];
            }
        },
        internal: {
        },
    },
    tag: {
        async upsert(tag: Tag) {
            return mattersSyncDB && await mattersSyncDB.collection("tags").replaceOne(
                {id: tag.id},
                tag,
                {upsert: true},
            );
        },
        async exists(id: TagId): Promise<boolean> {
            if (mattersSyncDB) {
                const existings = mattersSyncDB.collection("tags").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findActiveByIds(ids: TagId[]): Promise<Tag[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("tags")
                                    .find({id: {$in: ids}})
                                    .project(skipInternalId)
                                    .toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<TagId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("tags")
                                    .find()
                                    .project({id: 1})
                                    .map((tag: Tag) => tag.id)
                                    .toArray();
            }
            else {
                return [];
            }
        },
    },
    spiderRecord: {
        async upsert(record: SpiderRecord) {
            return mattersSyncDB && await mattersSyncDB.collection("spiderRecords").replaceOne(
                {entityId: record.entityId},
                record,
                {upsert: true},
            );
        },
        async exists(entityId: string): Promise<boolean> {
            if (mattersSyncDB) {
                const existings = mattersSyncDB.collection("spiderRecords").find({entityId}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findByEntityId(entityId: string): Promise<SpiderRecord | null> {
            return mattersSyncDB && mattersSyncDB.collection("spiderRecords").findOne({
                entityId,
            });
        },
        async saveSpiderState(state: SpiderState) {
            return mongodb.spiderRecord.upsert(state);
        },
        async loadSpiderState(): Promise<SpiderState | null> {
            return await mongodb.spiderRecord.findByEntityId("spider-state") as SpiderState;
        },
        async findBefore(time: number): Promise<SpiderRecordEntity[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("spiderRecords").find({
                    lastFetch: {
                        $exists: true,
                        $lt: time,
                    },
                }).toArray();
            }
            else {
                return [];
            }
        },
        async findAfter(time: number): Promise<SpiderRecordEntity[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("spiderRecords").find({
                    lastFetch: {
                        $exists: true,
                        $gt: time,
                    },
                }).toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(entityId: string) {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("spiderRecords").deleteMany({
                    entityId,
                });
            }
            else {
                return [];
            }
        },
        async getAllEntityIds(): Promise<ArticleId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("spiderRecords")
                             .find()
                             .project({entityId: 1})
                             .map((r: SpiderRecord) => r.entityId).toArray();
            }
            else {
                return [];
            }
        },
    },
    account: {
        async upsert(account: MaltaaAccount) {
            return mainDB && await mainDB.collection("accounts").replaceOne(
                {id: account.id},
                account,
                {upsert: true},
            );
        },
        async findByUserName(username: string): Promise<MaltaaAccount | null> {
            return mainDB && mainDB.collection("accounts").findOne({
                username,
            }, {projection: skipInternalId});
        },
        async findById(id: AccountId): Promise<MaltaaAccount | null> {
            return mainDB && mainDB.collection("accounts").findOne({
                id,
            }, {projection: skipInternalId});
        },
        async findByMattersId(id: UserId): Promise<MaltaaAccount | null> {
            return mainDB && mainDB.collection("accounts").findOne({
                "matters.id": id,
            }, {projection: skipInternalId});
        },
        async exists(id: string): Promise<boolean> {
            if (mainDB) {
                const existings = mainDB.collection("accounts").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
    },
    token: {
        async upsert(token: AuthToken) {
            return mainDB && await mainDB.collection("tokens").replaceOne(
                {id: token.id},
                token,
                {upsert: true},
            );
        },
        async findById(id: AuthTokenId): Promise<AuthToken | null> {
            return mainDB && mainDB.collection("tokens").findOne({
                id,
            });
        },
    },
    rendering: {
        async upsert(rendering: IPFSRendering) {
            return mainDB && await mainDB.collection("rendering").replaceOne(
                {id: rendering.id},
                rendering,
                {upsert: true},
            );
        },
        async findById(id: IPFSHash): Promise<IPFSRendering | null> {
            return mainDB && mainDB.collection("rendering").findOne({
                id,
            });
        },
    },
    assortment: {
        async upsert(assortment: Assortment) {
            if (!isLegalAssortment(assortment)) {
                throw new Error("Malformed assortment");
            }
            return mainDB && await mainDB.collection("assortments").replaceOne(
                {id: assortment.id},
                assortment,
                {upsert: true},
            );
        },
        async findById(id: AssortmentId): Promise<Assortment | null> {
            return mainDB && mainDB.collection("assortments").findOne({
                id,
            }, {projection: skipInternalId});
        },
        async findByIds(ids: AssortmentId[]): Promise<Assortment[]> {
            if (mainDB) {
                return mainDB.collection("assortments").find({
                    id: {$in: ids}
                }).project(skipInternalId).toArray();
            }
            else {
                return [];
            }
        },

        async findByIdentifier(identifier: AssortmentIdentifier): Promise<Assortment | null> {
            const {subpath, owner, contentType} = identifier;
            return mainDB && mainDB.collection("assortments").findOne({
                subpath,
                owner,
                contentType,
            }, {projection: skipInternalId});
        },
        async findByOwners(owners: UserId[]): Promise<Assortment[]> {
            if (!mainDB) {
                return [];
            }
            return mainDB.collection("assortments").find({
                owner: {$in: owners},
            }).project(skipInternalId).toArray();
        },
        async findByItemIds(ids: string[]): Promise<Assortment[]> {
            if (mainDB) {
                return mainDB.collection("assortments").find({
                    "items.id": {$in: ids},
                }).project(skipInternalId).toArray();
            }
            else {
                return [];
            }
        },
        async findByUpstreams(upstreams: AssortmentId[]): Promise<Assortment[]> {
            if (mainDB) {
                return mainDB.collection("assortments").find({
                    "upstreams": {$in: upstreams},
                }).project(skipInternalId).toArray();
            }
            else {
                return [];
            }
        },
    },
    activity: {
        async insert(activity: Activity) {
            return activityDB && await activityDB.collection("activities").insertOne({...activity});
        },
    },

    siteConfig: {
        async get(): Promise<SiteConfig | null> {
            return mainDB && mainDB.collection("siteConfig").findOne({});
        },
        async getWithFallback(fallback: SiteConfig): Promise<SiteConfig> {
            if (mainDB) {
                return (await mainDB.collection("siteConfig").findOne({})) || fallback;
            }
            else {
                return fallback;
            }
        },
        async set(config: SiteConfig) {
            return mainDB && await mainDB.collection("siteConfig").replaceOne(
                {},
                config,
                {upsert: true},
            );
        },
    },

    dataStatus: {
        async get(): Promise<DataStatus | null> {
            return mainDB && mainDB.collection("dataStatus").findOne({});
        },
        async getWithFallback(): Promise<DataStatus> {
            if (mainDB) {
                return (await mainDB.collection("dataStatus").findOne({})) || fallbackDataStatus;
            }
            else {
                return fallbackDataStatus;
            }
        },
        async set(status: DataStatus) {
            return mainDB && await mainDB.collection("dataStatus").replaceOne(
                {},
                status,
                {upsert: true},
            );
        },
    },

    async close() {
        return client?.close();
    },
};

export const db = mongodb;
