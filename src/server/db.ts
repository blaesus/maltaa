import { Collection, Db, MongoClient } from "mongodb";
import {
    Article,
    SpiderRecord,
    SpiderState,
    Transaction,
    TransactionMaltaId,
    Comment,
    UserPublic,
    UserId,
} from "../data-types";

const dbName = 'malta';

let client: MongoClient | null = null;

let mdb: Db | null = null;

const mongodb = {
    async connect() {
        const url = 'mongodb://localhost:27017';
        client = new MongoClient(url, {
            useUnifiedTopology: true
        });
        await client.connect();
        mdb = client.db(dbName);
    },
    async setup() {
        if (!mdb) {
            return;
        }
        await mdb.createIndex("articles", {
            mediaHash: 1,
            createdAt: 1,
        });
        await mdb.createIndex("spider-records", {
            entityId: 1,
            lastFetch: 1,
        });
        await mdb.createIndex("users", {
            id: 1,
        });
        await mdb.createIndex("comments", {
            id: 1,
        });
        await mdb.createIndex("transactions", {
            mid: 1,
        });
    },
    article: {
        async upsert(article: Article) {
            return mdb && await mdb.collection("articles").replaceOne(
                {mediaHash: article.mediaHash},
                article,
                {upsert: true},
            )
        },
        async exists(mediaHash: string): Promise<boolean> {
            if (mdb) {
                const existings = mdb.collection("articles").find({mediaHash}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false
            }
        },
        async findByMH(mediaHash: string): Promise<Article | null> {
            return mdb && mdb.collection("articles").findOne({
                mediaHash,
            });
        },
    },
    transaction: {
        async upsert(transaction: Transaction) {
            return mdb && await mdb.collection("transactions").replaceOne(
                {mid: transaction.mid},
                transaction,
                {upsert: true},
            );
        },
        async findByIds(ids: TransactionMaltaId[]): Promise<Transaction[]> {
            if (mdb) {
                return mdb.collection("transactions").find({ mid: { $in: ids } }).toArray();
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
        async findByIds(ids: TransactionMaltaId[]): Promise<Transaction[]> {
            if (mdb) {
                return mdb.collection("comments").find({ id: { $in: ids } }).toArray();
            }
            else {
                return [];
            }
        },
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
        async findByIds(ids: TransactionMaltaId[]): Promise<Transaction[]> {
            if (mdb) {
                return mdb.collection("users").find({ id: { $in: ids } }).toArray();
            }
            else {
                return [];
            }
        },
    },
    spiderRecord: {
        async upsert(record: SpiderRecord) {
            return mdb && await mdb.collection("spider-records").replaceOne(
                {entityId: record.entityId, type: record.type},
                record,
                {upsert: true},
            )
        },
        async exists(entityId: string): Promise<boolean> {
            if (mdb) {
                const existings = mdb.collection("spider-records").find({entityId}).limit(1);
                return await existings.count() >= 1;
            }
            else {
                return false
            }
        },
        async findByUID(entityId: string): Promise<SpiderRecord | null> {
            return mdb && mdb.collection("spider-records").findOne({
                entityId,
            });
        },
        async saveSpiderState(state: SpiderState) {
            return mongodb.spiderRecord.upsert(state);
        },
        async loadSpiderState(): Promise<SpiderState | null> {
            return await mongodb.spiderRecord.findByUID("spider-state") as SpiderState;
        }
    },
    async close() {
        return client?.close();
    }
};

export const db = mongodb;
