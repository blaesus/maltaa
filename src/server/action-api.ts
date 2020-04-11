import { BinaryLike, scrypt } from "crypto";

import { v4 as uuidv4 } from "uuid";

import { Account, Article, PasswordRecord, Privileges, UserId } from "../definitions/data-types";
import { db } from "./db";
import {daysAgoInEpoch, daysToMs, dedupe, getFallbackPreferences, last} from "../utils";
import { MaltaaAction } from "../definitions/actions";
import { ArticleSort } from "../sorts";
import { findCommentsUnderArticle } from "./restlike-api";
import { spiderCommander } from "./spider-commander";
import { randomString } from "./serverUtils";
import { SCRYPT_KEYLEN, SCRYPT_SALT_LENGTH } from "../settings";
import * as URL from "url";
import { isMattersArticleUrl } from "../matters-specifics";

async function scryptAsync(
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, keylen, (error, derivedKey) => {
            if (error) {
                reject(error)
            }
            else {
                resolve(derivedKey)
            }
        })
    })
}

async function hashPassword(password: string): Promise<PasswordRecord> {
    const salt = randomString(SCRYPT_SALT_LENGTH);
    const keylen = SCRYPT_KEYLEN;
    const hash = (await scryptAsync(password, salt, keylen)).toString("hex");
    return {
        type: "scrypt",
        hash,
        salt,
        keylen,
    }
}

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
    }
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
                }
            }
            else {
                return {
                    type: "GenericError",
                    reason: "user not found",
                }
            }
        }
        case "ViewArticle": {
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
        case "Register": {
            const {username, password, preferences} = request;
            const accountPreferences = preferences || getFallbackPreferences();
            const existing = await db.account.findByUserName(username);
            if (existing) {
                return {
                    type: "GenericError",
                    reason: "duplicated username"
                }
            }
            const currentCount = await db.account.count();
            const privileges: Privileges[] = currentCount ? ["normal"] : ["admin", "normal"];
            const newAccount: Account = {
                id: uuidv4(),
                username,
                privileges,
                preferences: accountPreferences,
                password: await hashPassword(password),
                maltaaToken: [],
                mattersIds: [],
                mattersTokens: {},
                publicKeys: [],
            };
            await db.account.upsert(newAccount);
            return {
                type: "ProvideEntities",
                data: {

                }
            }
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
                        reason: "No subpath"
                    }
                }
                else {
                    const segments = pathname.split("/");
                    const [_, userSegment, articleSegment] = segments;
                    const mediaHash = last(articleSegment.split('-'));
                    if (!mediaHash) {
                        return {
                            type: "GenericError",
                            reason: "Can't find media hash"
                        }
                    }
                    else {
                        const article = (await db.article.findActiveByMHs([mediaHash]))[0];
                        if (!article) {
                            return {
                                type: "GenericError",
                                reason: "Can't find article"
                            }
                        }
                        else {
                            return {
                                type: "SearchResultArticleRedirect",
                                id: article.id,
                            }
                        }
                    }
                }
            }

            return {
                type: "GenericError",
                reason: "unknown type"
            }
        }
        default: {
            return {
                type: "GenericError",
                reason: "unknown type"
            }
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
