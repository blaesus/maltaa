import { LoadArticles, MaltaaAction } from "../../definitions/Actions";
import { ArticleSort } from "../../sorts";
import { daysAgoInEpoch, daysToMs, dedupe } from "../../utils";
import { Article } from "../../definitions/Article";
import { db } from "../db";
import { UserId } from "../../definitions/User";

async function queryArticles(params: {
    sort: ArticleSort,
    periodInDays?: number,
    backtrackInDays?: number,
    pageNumber?: number,
    author?: UserId | null,
}) {
    const pageNumber = params.pageNumber || 0;
    const {sort, periodInDays, backtrackInDays, author} = params;

    let earliest: number | undefined = undefined;
    let latest: number | undefined = undefined;
    if (backtrackInDays && periodInDays) {
        latest = daysAgoInEpoch(backtrackInDays);
        earliest = latest - daysToMs(periodInDays);
    }
    else if (backtrackInDays) {
        latest = daysAgoInEpoch(backtrackInDays);
    }
    else if (periodInDays) {
        earliest = daysAgoInEpoch(periodInDays);
    }

    let articles: Article[] = [];
    switch (sort) {
        case "comments": {
            articles = await db.article.findActiveByComments({
                pageNumber,
                earliest,
                latest,
                author,
            });
            break;
        }
        case "appreciationAmount": {
            articles = await db.article.findActiveByAppreciationAmount({
                pageNumber,
                earliest,
                latest,
                author,
            });
            break;
        }
        case "old": {
            articles = await db.article.findActiveByAge({
                pageNumber,
                earliest,
                latest,
                author,
            });
            break;
        }
        default: {
            articles = await db.article.findActiveByRecency({
                pageNumber,
                earliest,
                latest,
                author,
            });
            break;
        }
    }
    const relatedUserIds = articles.map(article => article.author).filter(dedupe);
    const users = await db.user.findByIds(relatedUserIds);
    return {
        articles,
        users,
    };
}

export async function loadArticles(request: LoadArticles): Promise<MaltaaAction> {
    return {
        type: "ProvideEntities",
        data: await queryArticles(request),
    };

}