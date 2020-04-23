import * as Koa from "koa";
import * as KoaRouter from "koa-router";
import * as KoaLogger from "koa-logger";
import * as KoaBody from "koa-body";
import { db, SortedArticleQueryParams } from "./db";
import { fetchArticle, fetchTag, fetchUser } from "./matters-graphq-api";
import { API_PORT } from "./server-configs";
import { MaltaaAction } from "../definitions/Actions";
import { respond } from "./action-api";
import { Article, ArticleId, Comment } from "../definitions/Article";
import { TOKEN_LIFE } from "../settings";
import { isMaltaaAction } from "../validators";

function getEntityRequestHandler<T>(
    idFieldName: string,
    findByIds: (ids: string[]) => Promise<T[]>,
    entityFetch?: (id: string) => Promise<{ entity: T } | null>,
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
            };
        }
        return next();
    };
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
    const params: SortedArticleQueryParams = {
        pageNumber: Number.parseInt(query.page, 10),
    };
    switch (query.sort) {
        case "comments": {
            articles = await db.article.findActiveByComments(params);
            break;
        }
        case "appreciationAmount": {
            articles = await db.article.findActiveByAppreciationAmount(params);
            break;
        }
        default: {
            articles = await db.article.findActiveByRecency(params);
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

function verifyActionForm(data: unknown): MaltaaAction {
    const ok = isMaltaaAction(data);
    if (!ok) {
        throw new Error("Malformed");
    }
    else {
        return data as any;
    }
}

const AUTH_TOKEN_ID_KEY = "TOK";
const AUTH_TOKEN_SECRET_KEY = "SEC";

async function handleAction(context: Koa.Context, next: any) {
    context.response.type = "json";


    async function authenticateFromCookie(request: MaltaaAction, context: Koa.Context): Promise<MaltaaAction> {
        const targetTokenId = context.cookies.get(AUTH_TOKEN_ID_KEY);
        if (!targetTokenId) {
            return request;
        }
        const token = await db.token.findById(targetTokenId);
        if (!token) {
            return request;
        }
        const now = Date.now();
        if (now - token.created > TOKEN_LIFE) {
            return request;
        }
        const claimedSecret = context.cookies.get(AUTH_TOKEN_SECRET_KEY);
        if (!claimedSecret) {
            return request;
        }
        if (token.secret !== claimedSecret) {
            return request;
        }
        return {
            ...request,
            meta: {
                ...request.meta,
                account: token.holder,
            },
        };
    }

    try {
        const request = verifyActionForm(JSON.parse(context.request.body));
        const authenticatedRequest = await authenticateFromCookie(request, context);
        const response = await respond(authenticatedRequest);
        const token = response?.meta?.token;
        if (token) {
            context.cookies.set(AUTH_TOKEN_ID_KEY, token.id);
            context.cookies.set(AUTH_TOKEN_SECRET_KEY, token.secret);
        }
        else if (token === null) {
            context.cookies.set(AUTH_TOKEN_ID_KEY, "");
            context.cookies.set(AUTH_TOKEN_SECRET_KEY, "");
        }
        else {
            // Keep as is
        }
        context.status = 200;
        context.body = response;
    } catch (error) {
        context.status = 500;
        context.body = {
            type: "UnhandledError",
            error: error.message,
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
    console.log(`Maltaa REST API server running at ${API_PORT}`);
}

if (require.main === module) {
    !!main();
}
