import { Db, MongoClient } from "mongodb";
import { AuthToken, AuthTokenId } from "../definitions/AuthToken";
import { Assortment, AssortmentId, AssortmentIdentifier } from "../definitions/Assortment";
import { Activity } from "../definitions/Activity";
import { Article, ArticleId, Comment, CommentId, UserId } from "../definitions/Article";
import { Transaction, TransactionMaltaaId } from "../definitions/Transaction";
import { UserPublic } from "../definitions/User";
import { SpiderRecord, SpiderRecordEntity, SpiderState } from "../definitions/Spider";
import { SiteConfig } from "../definitions/SiteConfig";
import { Tag, TagId } from "../definitions/Tag";
import { AccountId, MaltaaAccount } from "../definitions/MaltaaAccount";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 128;

const mainDBName = "maltaa";
const activityDBName = "maltaaActivity";

let client: MongoClient | null = null;

let mainDB: Db | null = null;
let activityDB: Db | null = null;

interface ArticleQueryInternalParams {
    sortConditions: {},
    pageNumber: number,
    pageSize: number,
    earliest?: number,
    latest?: number,
}

async function findActiveArticles(params: ArticleQueryInternalParams): Promise<Article[]> {
    const {sortConditions, pageNumber, pageSize, earliest, latest} = params;
    if (mainDB) {
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

        return mainDB.collection("articles")
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
    },
    async ensureIndices() {
        if (!mainDB) {
            return;
        }
        if (!activityDB) {
            return;
        }
        {
            await mainDB.createIndex("articles", {id: 1}, {unique: true});
            await mainDB.createIndex("articles", {mediaHash: 1});
            await mainDB.createIndex("articles", {
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
            await mainDB.createIndex("spiderRecords", {entityId: 1, type: 1}, {unique: true});
            await mainDB.createIndex("spiderRecords", {lastFetch: 1});
        }
        {
            await mainDB.createIndex("users", {
                id: 1,
                userName: 1,
            }, {unique: true});
        }
        {
            await mainDB.createIndex("accounts", {id: 1}, {unique: true});
        }
        {
            await mainDB.createIndex("accounts", {
                "matters.id": 1,
            });
        }
        {
            await mainDB.createIndex("comments", {id: 1}, {unique: true});
            await mainDB.createIndex("comments", {
                parent: 1,
                state: 1,
            });
        }
        {
            await mainDB.createIndex("transactions", {mid: 1}, {unique: true});
            await mainDB.createIndex("transactions", {target: 1});
        }
        {
            await mainDB.createIndex("tags", {id: 1}, {unique: true});
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
            await mainDB.createIndex("assortments", {
                editors: 1,
            });
            await mainDB.createIndex("assortments", {
                "items.id": 1,
            });
        }

        {
            await activityDB.createIndex("activities", {id: 1}, {unique: true});
        }

    },
    article: {
        async upsert(article: Article) {
            return mainDB && await mainDB.collection("articles").replaceOne(
                {id: article.id},
                article,
                {upsert: true},
            );
        },
        async exists(id: string): Promise<boolean> {
            if (mainDB) {
                const existings = mainDB.collection("articles").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findActiveById(id: string): Promise<Article | null> {
            return mainDB && mainDB.collection("articles").findOne({id, state: "active"});
        },
        async findActiveByIds(ids: string[]): Promise<Article[]> {
            if (mainDB) {
                return mainDB.collection("articles").find({id: {$in: ids}, state: "active"}).toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByMHs(mhs: string[]): Promise<Article[]> {
            if (mainDB) {
                return mainDB.collection("articles").find({mediaHash: {$in: mhs}, state: "active"}).toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByUpstreams(id: string): Promise<Article[]> {
            if (mainDB) {
                return mainDB.collection("articles").find({upstreams: id, state: "active"}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<ArticleId[]> {
            if (mainDB) {
                return mainDB.collection("articles")
                             .find()
                             .project({id: 1})
                             .map((article: Article) => article.id).toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByRecency(params: SortedArticleQueryParams): Promise<Article[]> {
            return findActiveArticles(paramsConvert({createdAt: -1}, params));
        },
        async findActiveByComments(params: SortedArticleQueryParams): Promise<Article[]> {
            return findActiveArticles(paramsConvert({"derived.comments": -1}, params));
        },
        async findActiveByAppreciationAmount(params: SortedArticleQueryParams): Promise<Article[]> {
            return findActiveArticles(paramsConvert({"derived.appreciationAmount": -1}, params));
        },
        internal: {
            async findById(id: string): Promise<Article | null> {
                return mainDB && mainDB.collection("articles").findOne({id});
            },
            async findCreatedAfter(earliest: number): Promise<Article[]> {
                if (mainDB) {
                    return mainDB.collection("articles")
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
            return mainDB && await mainDB.collection("transactions").replaceOne(
                {mid: transaction.mid},
                transaction,
                {upsert: true},
            );
        },
        async findActiveByIds(ids: TransactionMaltaaId[]): Promise<Transaction[]> {
            if (mainDB) {
                return mainDB.collection("transactions").find({mid: {$in: ids}}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<{ mid: string }[]> {
            if (mainDB) {
                return mainDB.collection("transactions")
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
            if (mainDB) {
                return mainDB.collection("transactions").find({target}).toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(id: string) {
            if (mainDB) {
                return mainDB.collection("comments").deleteMany({
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
            return mainDB && await mainDB.collection("comments").replaceOne(
                {id: comment.id},
                comment,
                {upsert: true},
            );
        },
        async findActiveByIds(ids: TransactionMaltaaId[]): Promise<Comment[]> {
            if (mainDB) {
                return mainDB.collection("comments")
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
            if (mainDB) {
                return mainDB.collection("comments").find({parent}).toArray();
            }
            else {
                return [];
            }
        },
        async findByParents(parents: (ArticleId | CommentId)[]): Promise<Comment[]> {
            if (mainDB) {
                return mainDB.collection("comments").find({parent: {$in: parents}}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<UserId[]> {
            if (mainDB) {
                return mainDB.collection("comments")
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
            if (mainDB) {
                return mainDB.collection("comments").deleteMany({
                    id,
                });
            }
            else {
                return [];
            }
        },
        internal: {
            async findByIds(ids: TransactionMaltaaId[]): Promise<Comment[]> {
                if (mainDB) {
                    return mainDB.collection("comments").find({id: {$in: ids}}).toArray();
                }
                else {
                    return [];
                }
            },
        },
    },
    user: {
        async upsert(user: UserPublic) {
            return mainDB && await mainDB.collection("users").replaceOne(
                {id: user.id},
                user,
                {upsert: true},
            );
        },
        async exists(id: UserId): Promise<boolean> {
            if (mainDB) {
                const existings = mainDB.collection("users").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findByIds(ids: UserId[]): Promise<UserPublic[]> {
            if (mainDB) {
                return mainDB.collection("users").find({id: {$in: ids}}).toArray();
            }
            else {
                return [];
            }
        },
        async findByUserName(userName: UserId): Promise<UserPublic | null> {
            if (mainDB) {
                return mainDB.collection("users").findOne({userName});
            }
            else {
                return null;
            }
        },
        async getAllIds(): Promise<UserId[]> {
            if (mainDB) {
                return mainDB.collection("users").find().map((user: UserPublic) => user.id).toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(id: string) {
            if (mainDB) {
                return mainDB.collection("users").deleteMany({
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
            return mainDB && await mainDB.collection("tags").replaceOne(
                {id: tag.id},
                tag,
                {upsert: true},
            );
        },
        async exists(id: TagId): Promise<boolean> {
            if (mainDB) {
                const existings = mainDB.collection("tags").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findActiveByIds(ids: TagId[]): Promise<Tag[]> {
            if (mainDB) {
                return mainDB.collection("tags").find({id: {$in: ids}}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<TagId[]> {
            if (mainDB) {
                return mainDB.collection("tags").find().map((tag: Tag) => tag.id).toArray();
            }
            else {
                return [];
            }
        },
    },
    spiderRecord: {
        async upsert(record: SpiderRecord) {
            return mainDB && await mainDB.collection("spiderRecords").replaceOne(
                {entityId: record.entityId},
                record,
                {upsert: true},
            );
        },
        async exists(entityId: string): Promise<boolean> {
            if (mainDB) {
                const existings = mainDB.collection("spiderRecords").find({entityId}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false;
            }
        },
        async findByEntityId(entityId: string): Promise<SpiderRecord | null> {
            return mainDB && mainDB.collection("spiderRecords").findOne({
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
            if (mainDB) {
                return mainDB.collection("spiderRecords").find({
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
            if (mainDB) {
                return mainDB.collection("spiderRecords").find({
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
            if (mainDB) {
                return mainDB.collection("spiderRecords").deleteMany({
                    entityId,
                });
            }
            else {
                return [];
            }
        },
        async getAllEntityIds(): Promise<ArticleId[]> {
            if (mainDB) {
                return mainDB.collection("spiderRecords")
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
