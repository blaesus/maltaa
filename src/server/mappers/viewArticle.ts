import { MaltaaAction, ViewArticle } from "../../definitions/Actions";
import { db } from "../db";
import { spiderCommander } from "../spider-commander";
import { findCommentsUnderArticle } from "../restlike-api";
import { dedupe } from "../../utils";
import { Article, UserId } from "../../definitions/Article";

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
        const assortments = await db.assortment.findByItemIds(articles.map(a => a.id));
        const relatedUsers: UserId[] = [
            article.author,
            ...comments.map(comment => comment.author),
            ...articles.map(article => article.author),
            ...assortments.map(assortment => assortment.owner),
        ].filter(dedupe);
        const users = await db.user.findByIds(relatedUsers);
        return {
            type: "ProvideEntities",
            data: {
                articles,
                comments,
                users,
                assortments,
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