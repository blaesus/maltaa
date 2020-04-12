import { Collection, Db, MongoClient } from "mongodb";
import {
    Article,
    SpiderRecord,
    SpiderState,
    Transaction,
    TransactionMaltaaId,
    Comment,
    UserPublic,
    UserId, Tag, TagId, ArticleId, CommentId,
    Account, SiteConfig, SpiderRecordEntity, AccountId,
} from "../definitions/data-types";
import {AuthToken, AuthTokenId} from "../definitions/authToken";
import {Assortment, AssortmentContentType, AssortmentId, AssortmentIdentifier} from "../definitions/assortment";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 128;

const dbName = "maltaa";

let client: MongoClient | null = null;

let mdb: Db | null = null;

interface ArticleQueryInternalParams {
    sortConditions: {},
    pageNumber: number,
    pageSize: number,
    earliest?: number,
    latest?: number,
}

async function findActiveArticles(params: ArticleQueryInternalParams):  Promise<Article[]> {
    const {sortConditions, pageNumber, pageSize, earliest, latest} = params;
    if (mdb) {
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
                ]
            }
        }
        else if (earliest) {
            query.createdAt = earliestCondition;
        }
        else if (latest) {
            query.createdAt = latestCondition;
        }

        return mdb.collection("articles")
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
    }
}

const mongodb = {
    async connect() {
        const url = 'mongodb://localhost:27017';
        client = new MongoClient(url, {
            useUnifiedTopology: true
        });
        await client.connect();
        mdb = client.db(dbName);
    },
    async ensureIndices() {
        if (!mdb) {
            return;
        }
        {
            await mdb.createIndex("articles", {id: 1}, {unique: true});
            await mdb.createIndex("articles", {mediaHash: 1});
            await mdb.createIndex("articles", {
                createdAt: 1,
                author: 1,
                state: 1,
                "derived.comments": 1,
                "derived.commenters": 1,
                "derived.appreciations": 1,
                "derived.appreciationAmount": 1,
            }, {
                name: "article-sorts"
            });
        }

        {
            await mdb.createIndex("spiderRecords", {entityId: 1, type: 1}, {unique: true});
            await mdb.createIndex("spiderRecords", {lastFetch: 1});
        }
        {
            await mdb.createIndex("users", {
                id: 1,
                userName: 1,
            }, {unique: true});
        }
        {
            await mdb.createIndex("accounts", {id: 1}, {unique: true});
        }
        {
            await mdb.createIndex("accounts", {
                "matters.id": 1,
            });
        }
        {
            await mdb.createIndex("comments", {id: 1}, {unique: true});
            await mdb.createIndex("comments", {
                parent: 1,
                state: 1,
            });
        }
        {
            await mdb.createIndex("transactions", {mid: 1}, {unique: true});
            await mdb.createIndex("transactions", {target: 1});
        }
        {
            await mdb.createIndex("tags", {id: 1}, {unique: true});
        }
        {
            await mdb.createIndex("tokens", {id: 1}, {unique: true});
        }
        {
            await mdb.createIndex("assortments", {id: 1}, {unique: true});
            await mdb.createIndex("assortments", {
                subpath: 1,
                owner: 1,
                contentType: 1,
            }, {unique: true});
            await mdb.createIndex("assortments", {
                editors: 1,
            });
            await mdb.createIndex("assortments", {
                "items.id": 1,
            });
        }
    },
    article: {
        async upsert(article: Article) {
            return mdb && await mdb.collection("articles").replaceOne(
                {id: article.id},
                article,
                {upsert: true},
            )
        },
        async exists(id: string): Promise<boolean> {
            if (mdb) {
                const existings = mdb.collection("articles").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false
            }
        },
        async findActiveById(id: string): Promise<Article | null> {
            return mdb && mdb.collection("articles").findOne({id, state: "active"});
        },
        async findActiveByIds(ids: string[]): Promise<Article[]> {
            if (mdb) {
                return mdb.collection("articles").find({ id: { $in: ids }, state: "active" }).toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByMHs(mhs: string[]): Promise<Article[]> {
            if (mdb) {
                return mdb.collection("articles").find({ mediaHash: { $in: mhs }, state: "active" }).toArray();
            }
            else {
                return [];
            }
        },
        async findActiveByUpstreams(id: string): Promise<Article[]> {
            if (mdb) {
                return mdb.collection("articles").find({ upstreams: id, state: "active"}).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<ArticleId[]> {
            if (mdb) {
                return mdb.collection("articles")
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
                return mdb && mdb.collection("articles").findOne({id});
            },
            async findCreatedAfter(earliest: number): Promise<Article[]> {
                if (mdb) {
                    return mdb.collection("articles")
                        .find({
                            createdAt: {$gt: earliest},
                        })
                        .toArray();
                }
                else {
                    return [];
                }
            },

        }
    },
    transaction: {
        async upsert(transaction: Transaction) {
            return mdb && await mdb.collection("transactions").replaceOne(
                {mid: transaction.mid},
                transaction,
                {upsert: true},
            );
        },
        async findActiveByIds(ids: TransactionMaltaaId[]): Promise<Transaction[]> {
            if (mdb) {
                return mdb.collection("transactions").find({ mid: { $in: ids } }).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<{mid: string}[]> {
            if (mdb) {
                return mdb.collection("transactions")
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
            if (mdb) {
                return mdb.collection("transactions").find({target}).toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(id: string) {
            if (mdb) {
                return mdb.collection("comments").deleteMany({
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
            return mdb && await mdb.collection("comments").replaceOne(
                {id: comment.id},
                comment,
                {upsert: true},
            );
        },
        async findActiveByIds(ids: TransactionMaltaaId[]): Promise<Comment[]> {
            if (mdb) {
                return mdb.collection("comments")
                          .find({
                              id: { $in: ids },
                              state: "active"
                          })
                          .toArray();
            }
            else {
                return [];
            }
        },
        async findByParent(parent: ArticleId | CommentId): Promise<Comment[]> {
            if (mdb) {
                return mdb.collection("comments").find({ parent }).toArray();
            }
            else {
                return [];
            }
        },
        async findByParents(parents: (ArticleId | CommentId)[]): Promise<Comment[]> {
            if (mdb) {
                return mdb.collection("comments").find({ parent: {$in: parents} }).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<UserId[]> {
            if (mdb) {
                return mdb.collection("comments")
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
            if (mdb) {
                return mdb.collection("comments").deleteMany({
                    id,
                });
            }
            else {
                return [];
            }
        },
        internal: {
            async findByIds(ids: TransactionMaltaaId[]): Promise<Comment[]> {
                if (mdb) {
                    return mdb.collection("comments").find({ id: { $in: ids } }).toArray();
                }
                else {
                    return [];
                }
            },
        }
    },
    user: {
        async upsert(user: UserPublic) {
            return mdb && await mdb.collection("users").replaceOne(
                {id: user.id},
                user,
                {upsert: true},
            );
        },
        async exists(id: UserId): Promise<boolean> {
            if (mdb) {
                const existings = mdb.collection("users").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false
            }
        },
        async findByIds(ids: UserId[]): Promise<UserPublic[]> {
            if (mdb) {
                return mdb.collection("users").find({ id: { $in: ids } }).toArray();
            }
            else {
                return [];
            }
        },
        async findByUserName(userName: UserId): Promise<UserPublic | null> {
            if (mdb) {
                return mdb.collection("users").findOne({userName});
            }
            else {
                return null;
            }
        },
        async getAllIds(): Promise<UserId[]> {
            if (mdb) {
                return mdb.collection("users").find().map((user: UserPublic) => user.id).toArray();
            }
            else {
                return [];
            }
        },
        async deleteById(id: string) {
            if (mdb) {
                return mdb.collection("users").deleteMany({
                    id,
                });
            }
            else {
                return [];
            }
        },
        internal: {
        }

    },
    tag: {
        async upsert(tag: Tag) {
            return mdb && await mdb.collection("tags").replaceOne(
                {id: tag.id},
                tag,
                {upsert: true},
            );
        },
        async exists(id: TagId): Promise<boolean> {
            if (mdb) {
                const existings = mdb.collection("tags").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false
            }
        },
        async findActiveByIds(ids: TagId[]): Promise<Tag[]> {
            if (mdb) {
                return mdb.collection("tags").find({ id: { $in: ids } }).toArray();
            }
            else {
                return [];
            }
        },
        async getAllIds(): Promise<TagId[]> {
            if (mdb) {
                return mdb.collection("tags").find().map((tag: Tag) => tag.id).toArray();
            }
            else {
                return [];
            }
        },
    },
    spiderRecord: {
        async upsert(record: SpiderRecord) {
            return mdb && await mdb.collection("spiderRecords").replaceOne(
                {entityId: record.entityId},
                record,
                {upsert: true},
            )
        },
        async exists(entityId: string): Promise<boolean> {
            if (mdb) {
                const existings = mdb.collection("spiderRecords").find({entityId}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false
            }
        },
        async findByEntityId(entityId: string): Promise<SpiderRecord | null> {
            return mdb && mdb.collection("spiderRecords").findOne({
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
            if (mdb) {
                return mdb.collection("spiderRecords").find({
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
            if (mdb) {
                return mdb.collection("spiderRecords").find({
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
            if (mdb) {
                return mdb.collection("spiderRecords").deleteMany({
                    entityId,
                });
            }
            else {
                return [];
            }
        },
        async getAllEntityIds(): Promise<ArticleId[]> {
            if (mdb) {
                return mdb.collection("spiderRecords")
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
        async upsert(account: Account) {
            return mdb && await mdb.collection("accounts").replaceOne(
                {id: account.id},
                account,
                {upsert: true},
            );
        },
        async findByUserName(username: string): Promise<Account | null> {
            return mdb && mdb.collection("accounts").findOne({
                username,
            });
        },
        async findById(id: AccountId): Promise<Account | null> {
            return mdb && mdb.collection("accounts").findOne({
                id,
            });
        },
        async findByMattersId(id: UserId): Promise<Account | null> {
            return mdb && mdb.collection("accounts").findOne({
                'matters.id': id,
            });
        },
        async exists(id: string): Promise<boolean> {
            if (mdb) {
                const existings = mdb.collection("accounts").find({id}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false
            }
        },
    },
    token: {
        async upsert(token: AuthToken) {
            return mdb && await mdb.collection("tokens").replaceOne(
                {id: token.id},
                token,
                {upsert: true},
            );
        },
        async findById(id: AuthTokenId): Promise<AuthToken | null> {
            return mdb && mdb.collection("tokens").findOne({
                id
            });
        },
    },
    assortment: {
        async upsert(assortment: Assortment) {
            return mdb && await mdb.collection("assortments").replaceOne(
                {id: assortment.id},
                assortment,
                {upsert: true},
            );
        },
        async findById(id: AssortmentId): Promise<Assortment | null> {
            return mdb && mdb.collection("assortments").findOne({
                id
            });
        },
        async findByIdentifier(identifier: AssortmentIdentifier): Promise<Assortment[]> {
            if (!mdb) {
                return []
            }
            const {subpath, owner, contentType} = identifier;
            return mdb.collection("assortments").find({
                subpath,
                owner,
                contentType,
            }).toArray();
        },
        async findByOwners(owners: UserId[]): Promise<Assortment[]> {
            if (!mdb) {
                return []
            }
            return mdb.collection("assortments").find({
                owner: {$in: owners},
            }).toArray();
        },
        async findByItemIds(ids: string[]): Promise<Assortment[]> {
            if (mdb) {
                return mdb.collection("assortments").find({
                    "items.id": {$in: ids},
                }).toArray();
            }
            else {
                return [];
            }
        },

    },

    siteConfig: {
        async get(): Promise<SiteConfig | null> {
            return mdb && mdb.collection("siteConfig").findOne({});
        },
        async getWithFallback(fallback: SiteConfig): Promise<SiteConfig> {
            if (mdb)  {
                return (await mdb.collection("siteConfig").findOne({})) || fallback;
            }
            else {
                return fallback;
            }
        },
        async set(config: SiteConfig) {
            return mdb && await mdb.collection("siteConfig").replaceOne(
                {},
                config,
                {upsert: true},
            );
        },
    },
    async close() {
        return client?.close();
    }
};

export const db = mongodb;
