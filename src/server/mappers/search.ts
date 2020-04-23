import * as URL from "url";

import { isMattersArticleUrl } from "../../mattersSpecifics";
import { last } from "../../utils";
import { db } from "../db";
import { MaltaaAction, Search } from "../../definitions/Actions";
import { COMMAND_PREFIX } from "../../settings";

export async function search(request: Search): Promise<MaltaaAction> {
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
                        type: "SearchResult",
                        subtype: "ArticleRedirect",
                        id: article.id,
                    };
                }
            }
        }
    }
    else if (keyword.startsWith(COMMAND_PREFIX)) {
        const command = keyword.slice(1);
        switch (command) {
            case "r": {
                const articles = await db.article.findRandomActive(1);
                if (articles[0]) {
                    return {
                        type: "SearchResult",
                        subtype: "ArticleRedirect",
                        id: articles[0].id,
                    }
                }
                else {
                    return {
                        type: "GenericError",
                        reason: "No suitable random candidate",
                    };
                }
            }
            default: {
                return {
                    type: "GenericError",
                    reason: "Unknown command",
                };
            }
        }
    }
    else {
        return {
            type: "GenericError",
            reason: "Can't find a thing",
        };
    }
}