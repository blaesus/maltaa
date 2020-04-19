import { MaltaaAction, ViewAssortment } from "../../definitions/Actions";
import { Assortment, AssortmentIdentifier } from "../../definitions/Assortment";
import { Article } from "../../definitions/Article";
import { UserPublic } from "../../definitions/User";

import { db } from "../db";
import { dedupe, dedupeById } from "../../utils";

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
    const upstreams = await db.assortment.findByUpstreams(assortment.upstreams);

    const assortments = [assortment, ...upstreams];

    const controllers = [assortment.owner, ...assortment.editors];
    const relevantUsers = [...controllers, ...assortments.map(a => a.owner)].filter(dedupe);

    let articles: Article[] = [];
    let users: UserPublic[] = await db.user.findByIds(relevantUsers);
    const ids = assortment.items.map(item => item.id);
    if (assortment.contentType === "mixture" || assortment.contentType === "anthology") {
        articles = [...articles, ...await db.article.findActiveByIds(ids)];
        const authors = articles.map(article => article.author);
        articles = [...articles, ...await db.article.findActiveByIds(authors)];
    }
    if (assortment.contentType === "mixture" || assortment.contentType === "roll") {
        users = [...users, ...await db.user.findByIds(ids)];
    }
    articles = dedupeById(articles);
    users = dedupeById(users);

    return {
        type: "ProvideEntities",
        data: {
            assortments,
            articles,
            users,
        }
    }
}
