import { v4 as uuidv4 } from "uuid";
import { db } from "../db";

import { CreateAssortment, MaltaaAction } from "../../definitions/Actions";
import { Assortment, AssortmentItem, AssortmentPolicy } from "../../definitions/Assortment";

const defaultPolicy: AssortmentPolicy = {
    archived: false,
    allowForking: true,
}

export async function createAssortment(request: CreateAssortment): Promise<MaltaaAction> {
    const accountId = request?.meta?.account;
    if (!accountId) {
        return {
            type: "GenericError",
            reason: "Not authenticated"
        }
    }
    const account = await db.account.findById(accountId);
    if (!account) {
        return {
            type: "GenericError",
            reason: "Don't know you"
        }
    }
    const owner = request.meta?.operator;
    if (!owner) {
        return {
            type: "GenericError",
            reason: "No user claimed"
        }
    }
    if (!account.mattersIds.includes(owner)) {
        return {
            type: "GenericError",
            reason: "Doesn't control owner user"
        }
    }
    const existing = await db.assortment.findByIdentifier({
        owner,
        subpath: request.subpath,
        contentType: request.contentType,
    });
    if (existing) {
        return {
            type: "GenericError",
            reason: "Path taken",
        }
    }
    let items: AssortmentItem[] = [];
    if (request.upstreams.length) {
        const upstreams = await db.assortment.findByIds(request.upstreams);
        items = upstreams.map(upstream => upstream.items).flat();
    }

    const newAssortment: Assortment = {
        id: uuidv4(),
        title: request.title,
        subpath: request.subpath,
        mattersArticleBaseId: null,
        owner,
        editors: [owner],
        upstreams: request.upstreams,
        contentType: request.contentType,
        description: "",
        items,
        policy: defaultPolicy,
    }

    await db.assortment.upsert(newAssortment);
    return {
        type: "ProvideEntities",
        data: {
            assortments: [
                newAssortment,
            ],
        }
    }

}