import { isMattersArticleUrl } from "../../mattersSpecifics";
import * as URL from "url";
import { last } from "../../utils";
import { db } from "../db";
import { MaltaaAction, Search } from "../../definitions/Actions";

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
                        type: "SearchResultArticleRedirect",
                        id: article.id,
                    };
                }
            }
        }
    }
    else {
        return {
            type: "GenericError",
            reason: "Can't find a thing",
        }
    }
}