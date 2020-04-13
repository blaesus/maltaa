import { MaltaaAction, ViewAssortment } from "../../definitions/actions";
import { Assortment, AssortmentIdentifier } from "../../definitions/assortment";
import { db } from "../db";
import { Article, UserPublic } from "../../definitions/data-types";
import { dedupeById } from "../../utils";

export async function viewAssortment(request: ViewAssortment): Promise<MaltaaAction> {
    let assortment: Assortment | null = null;
    if (typeof request.assortment === "string") {
        assortment = await db.assortment.findById(request.assortment);
    }
    else if (typeof request.assortment === "object") {
        const user = await db.user.findByUserName(request.assortment.ownerUsername);
        if (!user) {
            return {
                type: "GenericError",
                reason: "Can't find user"
            }
        }
        const identifier: AssortmentIdentifier = {
            owner: user.id,
            contentType: request.assortment.contentType,
            subpath: request.assortment.subpath,
        };
        assortment = await db.assortment.findByIdentifier(identifier);
    }
    if (!assortment) {
        return {
            type: "GenericError",
            reason: "Can't find assortment"
        }
    }

    const controllers = [assortment.owner, ...assortment.editors];

    let articles: Article[] = [];
    let users: UserPublic[] = await db.user.findByIds(controllers);
    const ids = assortment.items.map(item => item.id);
    if (assortment.contentType === "mixed" || assortment.contentType === "article") {
        articles = [...articles, ...await db.article.findActiveByIds(ids)];
        const authors = articles.map(article => article.author);
        articles = [...articles, ...await db.article.findActiveByIds(authors)];
    }
    if (assortment.contentType === "mixed" || assortment.contentType === "user") {
        users = [...users, ...await db.user.findByIds(ids)];
    }
    articles = dedupeById(articles);
    users = dedupeById(users);

    return {
        type: "ProvideEntities",
        data: {
            assortments: [assortment],
            articles,
            users,
        }
    }
}
