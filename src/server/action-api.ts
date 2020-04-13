import * as URL from "url";

import { db } from "./db";

import { Article } from "../definitions/data-types";
import { MaltaaAction } from "../definitions/actions";
import { ArticleSort } from "../sorts";

import { register } from "./mappers/register";
import { createAssortment } from "./mappers/createAssortment";
import { signout } from "./mappers/signout";
import { viewArticle } from "./mappers/viewArticle";
import { updateAssortment } from "./mappers/updateAssortment";
import { viewAssortment } from "./mappers/viewAssortment";
import { signin } from "./mappers/signin";

import { isMattersArticleUrl } from "../matters-specifics";
import { daysAgoInEpoch, daysToMs, dedupe, last } from "../utils";

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
            const user = await db.user.findByUserName(request.username);
            if (user) {
                return {
                    type: "ProvideEntities",
                    data: {
                        users: [user],
                    },
                };
            }
            else {
                return {
                    type: "GenericError",
                    reason: "user not found",
                };
            }
        }
        case "ViewArticle": {
            return viewArticle(request);
        }
        case "Register": {
            return register(request);
        }
        case "GetMyData": {
            const account = request?.meta?.account;
            if (!account) {
                return {
                    type: "GenericError",
                    reason: "I don't know you",
                };
            }
            const me = await db.account.findById(account);
            if (!me) {
                return {
                    type: "GenericError",
                    reason: "I can't find you",
                };
            }
            const myUsers = await db.user.findByIds(me.mattersIds);
            const myAssortments = await db.assortment.findByOwners(me.mattersIds);
            return {
                type: "ProvideEntities",
                data: {
                    me,
                    users: myUsers,
                    assortments: myAssortments,
                },
            };
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
            const {keyword} = request;
            if (isMattersArticleUrl(keyword)) {
                const targetUrl = decodeURIComponent(keyword);
                const url = URL.parse(targetUrl);
                const pathname = url.pathname;
                if (!pathname) {
                    return {
                        type: "GenericError",
                        reason: "No subpath",
                    };
                }
                else {
                    const segments = pathname.split("/");
                    const [_, userSegment, articleSegment] = segments;
                    const mediaHash = last(articleSegment.split("-"));
                    if (!mediaHash) {
                        return {
                            type: "GenericError",
                            reason: "Can't find media hash",
                        };
                    }
                    else {
                        const article = (await db.article.findActiveByMHs([mediaHash]))[0];
                        if (!article) {
                            return {
                                type: "GenericError",
                                reason: "Can't find article",
                            };
                        }
                        else {
                            return {
                                type: "SearchResultArticleRedirect",
                                id: article.id,
                            };
                        }
                    }
                }
            }

            return {
                type: "GenericError",
                reason: "unknown type",
            };
        }
        case "Signin": {
            return signin(request);
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
