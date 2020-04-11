import * as Koa from "koa";
import * as KoaRouter from "koa-router";
import * as KoaLogger from "koa-logger";
import * as KoaBody from "koa-body";
import { db } from "./db";
import { fetchArticle, fetchTag, fetchUser } from "./matters-graphq-api";
import { Article, ArticleId, UserId, Comment, Account } from "../definitions/data-types";
import {randomBytes} from "crypto"
import { API_PORT } from "./server-configs";
import { MaltaaAction } from "../definitions/actions";
import { respond } from "./action-api";

function getEntityRequestHandler<T>(
    idFieldName: string,
    findByIds: (ids: string[]) => Promise<T[]>,
    entityFetch?: (id: string) => Promise<{entity: T} | null>,
) {
    return async (context: Koa.Context, next: any) => {
        context.response.type = "json";
        const {query} = context.request;
        const id = context.params[idFieldName];
        let entity: T | null = null;
        if (typeof query.refetch !== "undefined" && entityFetch) {
            const data = await entityFetch(id);
            if (data) {
                context.status = 200;
                entity = data.entity;
            }
        }
        else {
            const entities = await findByIds([id]);
            if (entities[0]) {
                context.status = 203;
                entity = entities[0];
            }
            else {
                context.status = 404;
            }
        }
        if (entity) {
            let jsonResponse: string;
            if (typeof query.pretty !== "undefined") {
                jsonResponse = JSON.stringify(entity, null, 4);
            }
            else {
                jsonResponse = JSON.stringify(entity);
            }
            context.body = jsonResponse;
        }
        else {
            context.status = 404;
            context.body = {
                error: "not found",
            }
        }
        return next();
    }
}

export async function findCommentsUnderArticle(id: ArticleId): Promise<Comment[]> {
    const firstLevelComments = await db.comment.findByParent(id);
    const firstLevelCommentsIds = firstLevelComments.map(comment => comment.id);
    const secondLevelComments = await db.comment.findByParents(firstLevelCommentsIds);
    const comments = [...firstLevelComments, ...secondLevelComments];
    return comments;
}

async function getComments(context: Koa.Context, next: any) {
    const targetArticleId = context.params.articleId;
    context.response.type = "json";
    const article = await db.article.findActiveById(targetArticleId);
    if (article) {
        const comments = await findCommentsUnderArticle(article.id);
        context.status = 203;
        context.body = comments;
    }
    else {
        context.status = 404;
        context.body = {};
    }
    return next();
}


async function getArticles(context: Koa.Context, next: any) {
    const {query} = context.request;
    context.response.type = "json";
    let articles: Article[] = [];
    switch (query.sort) {
        case "comments": {
            articles  = await db.article.findActiveByComments(query.page);
            break;
        }
        default: {
            articles = await db.article.findActiveByRecency(query.page);
            break;

        }
    }
    context.status = 203;
    let jsonResponse: string;
    if (typeof query.pretty !== "undefined") {
        jsonResponse = JSON.stringify(articles, null, 4);
    }
    else {
        jsonResponse = JSON.stringify(articles);
    }
    context.body = jsonResponse;

    return next();
}

function verifyActionForm(data: any): MaltaaAction {
    const ok = typeof data === "object" && typeof data.type === "string";
    if (!ok) {
        throw new Error("Malformed");
    }
    else {
        return data;
    }
}

async function handleAction(context: Koa.Context, next: any) {
    context.response.type = "json";
    try {
        const request = verifyActionForm(JSON.parse(context.request.body));
        const response = await respond(request);
        context.status = 200;
        context.body = response;
    }
    catch (error) {
        context.status = 500;
        context.body = {
            type: "Error",
            error,
        };
    }
    return next();
}

async function main() {
    await db.connect();

    const app = new Koa();
    app.proxy = true;
    app.use(KoaLogger());
    app.use(KoaBody());

    const router = new KoaRouter();
    router.prefix("/api");

    router.get("/user/:id", getEntityRequestHandler("id", db.user.findByIds, fetchUser));
    router.get("/tag/:id", getEntityRequestHandler("id", db.tag.findActiveByIds, fetchTag));
    router.get("/transaction/:id", getEntityRequestHandler("id", db.transaction.findActiveByIds));
    router.get("/comment/:id", getEntityRequestHandler("id", db.comment.findActiveByIds));
    router.get("/article/:id", getEntityRequestHandler("id", db.article.findActiveByIds, fetchArticle));

    const commentsRouter = new KoaRouter();
    commentsRouter.get("/", getComments);

    router.use("/article/:articleId/comments", commentsRouter.routes(), commentsRouter.allowedMethods());
    router.get("/articles", getArticles);

    router.post("/action", handleAction);

    app.use(router.routes())
       .use(router.allowedMethods());

    app.listen(API_PORT);
    console.log(`Maltaa API server running at ${API_PORT}`);
}

if (require.main === module) {
    !!main();
}
