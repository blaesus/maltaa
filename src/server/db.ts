import { Db, MongoClient } from "mongodb";

import { AuthToken, AuthTokenId } from "../definitions/AuthToken";
import { Assortment, AssortmentId, AssortmentIdentifier } from "../definitions/Assortment";
import { Activity } from "../definitions/Activity";
import { Article, ArticleId, Comment, CommentId } from "../definitions/Article";
import { Transaction, TransactionMaltaaId } from "../definitions/Transaction";
import { UserId, UserPublic } from "../definitions/User";
import { SpiderRecord, SpiderRecordEntity, SpiderState } from "../definitions/Spider";
import { SiteConfig } from "../definitions/SiteConfig";
import { Tag, TagId } from "../definitions/Tag";
import { AccountId, MaltaaAccount } from "../definitions/MaltaaAccount";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 128;

const mainDBName = "maltaa";
const mattersSyncDBName = "maltaaMattersSync";
const activityDBName = "maltaaActivity";

let client: MongoClient | null = null;

let mainDB: Db | null = null;
let mattersSyncDB: Db | null = null;
let activityDB: Db | null = null;

interface ArticleQueryInternalParams {
    sortConditions: {},
    pageNumber: number,
    pageSize: number,
    earliest?: number,
    latest?: number,
}

const fallbackParams: SortedArticleQueryParams = {
    pageNumber: 0,
}

async function findActiveArticles(params: ArticleQueryInternalParams): Promise<Article[]> {
    const {sortConditions, pageNumber, pageSize, earliest, latest} = params;
    if (mattersSyncDB) {
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

        return mattersSyncDB.collection("articles")
                            .find(query)
                            .sort(sortConditions)
                            .skip(pageNumber * pageSize)
                            .limit(pageSize)
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
}

function paramsConvert(sortConditions: {}, params: SortedArticleQueryParams): ArticleQueryInternalParams {
    return {
        sortConditions,
        pageNumber: params.pageNumber,
        pageSize: Math.min(params.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
        earliest: params.earliest,
        latest: params.latest,
    };
}

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
    async ensureIndices() {
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
                    state: 1,
                    "derived.comments": 1,
                    "derived.commenters": 1,
                    "derived.appreciations": 1,
                    "derived.appreciationAmount": 1,
                }, {
                    name: "article-sorts",
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
                });
            }
            {
                await mattersSyncDB.createIndex("transactions", {mid: 1}, {unique: true});
                await mattersSyncDB.createIndex("transactions", {target: 1});
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
            return mattersSyncDB && mattersSyncDB.collection("articles").findOne({id, state: "active"});
        },
        async findActiveByIds(ids: string[]): Promise<Article[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("articles").find({id: {$in: ids}, state: "active"}).toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByMHs(mhs: string[]): Promise<Article[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("articles").find({mediaHash: {$in: mhs}, state: "active"}).toArray();
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
            return findActiveArticles(paramsConvert({createdAt: -1}, params));
        },
        async findActiveByComments(params = fallbackParams): Promise<Article[]> {
            return findActiveArticles(paramsConvert({"derived.comments": -1}, params));
        },
        async findActiveByAppreciationAmount(params = fallbackParams): Promise<Article[]> {
            return findActiveArticles(paramsConvert({"derived.appreciationAmount": -1}, params));
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
                return mattersSyncDB.collection("transactions").find({mid: {$in: ids}}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<{ mid: string }[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("transactions")
                             .find()
                             .project({mid: 1})
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
                return mattersSyncDB.collection("comments").deleteMany({
                    id,
                });
            }
            else {
                return [];
            }
        },
    },
    comment: {
        async upsert(comment: Comment) {
            return mattersSyncDB && await mattersSyncDB.collection("comments").replaceOne(
                {id: comment.id},
                comment,
                {upsert: true},
            );
        },
        async findActiveByIds(ids: TransactionMaltaaId[]): Promise<Comment[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments")
                             .find({
                                 id: {$in: ids},
                                 state: "active",
                             })
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
        async getAllIds(): Promise<UserId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("comments")
                             .find()
                             .project({id: 1})
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
        internal: {
            async findByIds(ids: TransactionMaltaaId[]): Promise<Comment[]> {
                if (mattersSyncDB) {
                    return mattersSyncDB.collection("comments").find({id: {$in: ids}}).toArray();
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
                return mattersSyncDB.collection("users").find({id: {$in: ids}}).toArray();
            }
            else {
                return [];
            }
        },
        async findByUserName(userName: UserId): Promise<UserPublic | null> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("users").findOne({userName});
            }
            else {
                return null;
            }
        },
        async getAllIds(): Promise<UserId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("users").find().map((user: UserPublic) => user.id).toArray();
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
        internal: {},

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
                return mattersSyncDB.collection("tags").find({id: {$in: ids}}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<TagId[]> {
            if (mattersSyncDB) {
                return mattersSyncDB.collection("tags").find().map((tag: Tag) => tag.id).toArray();
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
            });
        },
        async findById(id: AccountId): Promise<MaltaaAccount | null> {
            return mainDB && mainDB.collection("accounts").findOne({
                id,
            });
        },
        async findByMattersId(id: UserId): Promise<MaltaaAccount | null> {
            return mainDB && mainDB.collection("accounts").findOne({
                "matters.id": id,
            });
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
    assortment: {
        async upsert(assortment: Assortment) {
            return mainDB && await mainDB.collection("assortments").replaceOne(
                {id: assortment.id},
                assortment,
                {upsert: true},
            );
        },
        async findById(id: AssortmentId): Promise<Assortment | null> {
            return mainDB && mainDB.collection("assortments").findOne({
                id,
            });
        },
        async findByIds(ids: AssortmentId[]): Promise<Assortment[]> {
            if (mainDB) {
                return mainDB.collection("assortments").find({
                    id: {$in: ids}
                }).toArray();
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
            });
        },
        async findByOwners(owners: UserId[]): Promise<Assortment[]> {
            if (!mainDB) {
                return [];
            }
            return mainDB.collection("assortments").find({
                owner: {$in: owners},
            }).toArray();
        },
        async findByItemIds(ids: string[]): Promise<Assortment[]> {
            if (mainDB) {
                return mainDB.collection("assortments").find({
                    "items.id": {$in: ids},
                }).toArray();
            }
            else {
                return [];
            }
        },
        async findByUpstreams(upstreams: AssortmentId[]): Promise<Assortment[]> {
            if (mainDB) {
                return mainDB.collection("assortments").find({
                    "upstreams": {$in: upstreams},
                }).toArray();
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
    async close() {
        return client?.close();
    },
};

export const db = mongodb;
