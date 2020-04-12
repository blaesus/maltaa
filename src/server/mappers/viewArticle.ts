import { MaltaaAction, ViewArticle } from "../../definitions/actions";
import { db } from "../db";
import { spiderCommander } from "../spider-commander";
import { Article, UserId } from "../../definitions/data-types";
import { findCommentsUnderArticle } from "../restlike-api";
import { dedupe } from "../../utils";

export async function viewArticle(request: ViewArticle): Promise<MaltaaAction> {
    const article = await db.article.findActiveById(request.article);
    !!spiderCommander.addArticle(request.article);
    if (article) {
        const upstreams = await db.article.findActiveByIds(article.upstreams);
        const downstreams = await db.article.findActiveByUpstreams(article.id);
        const articles: Article[] = [
            article, ...upstreams, ...downstreams,
        ];
        const comments = await findCommentsUnderArticle(article.id);
        const relatedUsers: UserId[] = [
            article.author,
            ...comments.map(comment => comment.author),
            ...articles.map(article => article.author),
        ].filter(dedupe);
        const users = await db.user.findByIds(relatedUsers);
        return {
            type: "ProvideEntities",
            data: {
                articles,
                comments,
                users,
            },
        }
    }
    else {
        return {
            type: "GenericError",
            reason: "article not found",
        }
    }
}