import { Collection, Db, MongoClient } from "mongodb";
import { Article } from "../data-types";

const dbName = 'malta';

let client: MongoClient | null = null;

let mdb: Db | null = null;

const mongodb = {
    async connect() {
        const url = 'mongodb://localhost:27017';
        client = new MongoClient(url);
        await client.connect();
        mdb = client.db(dbName);
    },
    async setup() {
        if (!mdb) {
            return;
        }
        await mdb.createIndex("articles", {
            mediaHash: 1,
        });
    },
    async upsertArticle(article: Article) {
        return mdb && await mdb.collection("articles").replaceOne(
            {mediaHash: article.mediaHash},
            article,
            {upsert: true},
        )
    },
    async findArticleByMediaHash(mediaHash: string): Promise<Article | null> {
        return mdb && mdb.collection("articles").findOne({
            mediaHash,
        });
    },
    async close() {
        return client?.close();
    }
};

export const db = mongodb;
