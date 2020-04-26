import { db } from "../db";

async function migrate() {
    const commentIds = await db.comment.internal.getAllIds();
    let index = 0;
    for (const id of commentIds) {
        const comment = (await db.comment.internal.findByIds([id]))[0];
        if (comment) {
            const parentAsArticle = await db.article.internal.findById(comment.parent);
            if (parentAsArticle) {
                comment.derived.root = parentAsArticle.id;
                await db.comment.upsert(comment);
            }
            else {
                const parentAsComment = (await db.comment.internal.findByIds([comment.parent]))[0];
                if (parentAsComment) {
                    const grandParent = await db.article.internal.findById(parentAsComment.parent);
                    if (!grandParent) {
                        console.warn(`Cannot find root for comment ${comment.id}`);
                    }
                    else {
                        comment.derived.root = grandParent.id;
                        await db.comment.upsert(comment);
                    }
                }
            }
        }
        if (index % 10 === 0) {
            console.info(`${index++}/${commentIds.length}`)
        }
    }
}

export default migrate;