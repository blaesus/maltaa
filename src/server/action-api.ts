import * as URL from "url";

import { db } from "./db";

import { MaltaaAction } from "../definitions/Actions";
import { Article } from "../definitions/Article";
import { ArticleSort } from "../sorts";

import { register } from "./mappers/register";
import { createAssortment } from "./mappers/createAssortment";
import { signout } from "./mappers/signout";
import { viewArticle } from "./mappers/viewArticle";
import { updateAssortment } from "./mappers/updateAssortment";
import { viewAssortment } from "./mappers/viewAssortment";
import { signin } from "./mappers/signin";

import { isMattersArticleUrl } from "../mattersSpecifics";
import { daysAgoInEpoch, daysToMs, dedupe, last } from "../utils";
import { setMyPreferences } from "./mappers/setMyPreferences";
import { search } from "./mappers/search";
import { getMyData } from "./mappers/getMyData";
import { viewUser } from "./mappers/viewUser";

async function getPodiumData(params: {
    sort: ArticleSort,
    periodInDays?: number,
    backtrackInDays?: number,
    pageNumber?: number,
}) {
    const pageNumber = params.pageNumber || 0;
    const {sort, periodInDays, backtrackInDays} = params;

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
            });
            break;
        }
        case "appreciationAmount": {
            articles = await db.article.findActiveByAppreciationAmount({
                pageNumber,
                earliest,
                latest,
            });
            break;
        }
        default: {
            articles = await db.article.findActiveByRecency({
                pageNumber,
                earliest,
                latest,
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

export async function respondCore(request: MaltaaAction): Promise<MaltaaAction> {
    switch (request.type) {
        case "LoadPodiumArticles": {
            return {
                type: "ProvideEntities",
                data: await getPodiumData({
                    sort: request.sort,
                    periodInDays: request.periodInDays,
                    backtrackInDays: request.backtrackInDays,
                    pageNumber: request.pageNumber,
                }),
            };
        }
        case "ViewUser": {
            return viewUser(request);
        }
        case "ViewArticle": {
            return viewArticle(request);
        }
        case "Register": {
            return register(request);
        }
        case "GetMyData": {
            return getMyData(request);
        }
        case "CreateAssortment": {
            return createAssortment(request);
        }
        case "UpdateAssortment": {
            return updateAssortment(request);
        }
        case "Signout": {
            return signout(request);
        }
        case "ViewAssortment": {
            return viewAssortment(request);
        }
        case "Search": {
            return search(request);
        }
        case "Signin": {
            return signin(request);
        }
        case "SetMyPreferences": {
            return setMyPreferences(request);
        }
        default: {
            return {
                type: "GenericError",
                reason: "unknown type",
            };
        }
    }
}

export async function respond(request: MaltaaAction): Promise<MaltaaAction> {
    const response = await respondCore(request);
    response.meta = {
        ...response.meta,
        request,
    };
    return response;
}
