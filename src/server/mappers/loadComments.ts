import { LoadComments, MaltaaAction } from "../../definitions/Actions";
import { dedupe, dedupeById, filterNulls } from "../../utils";
import { db } from "../db";

import { Comment } from "../../definitions/Article";

export async function loadComments(request: LoadComments): Promise<MaltaaAction> {
    const pageNumber = request.pageNumber || 0;
    const {sort, author} = request;

    let comments: Comment[] = [];
    switch (sort) {
        case "old": {
            comments = await db.comment.findActiveByAge({
                pageNumber,
                author,
            });
            break;
        }
        default: {
            comments = await db.comment.findActiveByRecency({
                pageNumber,
                author,
            });
            break;
        }
    }
    const replyTargets = await db.comment.findActiveByIds(filterNulls(comments.map(comment => comment.replyTarget).filter(Boolean)));

    comments = dedupeById([...comments, ...replyTargets]);
    const rootArticles = await db.article.findActiveByIds(comments.map(c => c.derived.root));
    const relatedUserIds = [
        ...comments.map(c => c.author),
        ...rootArticles.map(a => a.author),
    ].filter(dedupe);
    const users = await db.user.findByIds(relatedUserIds);
    return {
        type: "ProvideEntities",
        data: {
            comments,
            users,
            articles: rootArticles,
        }
    };

}