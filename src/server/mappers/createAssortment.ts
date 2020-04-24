import { v4 as uuidv4 } from "uuid";
import { db } from "../db";

import { CreateAssortment, MaltaaAction } from "../../definitions/Actions";
import { Assortment, AssortmentItem, AssortmentPolicy } from "../../definitions/Assortment";
import { authenticateOperator } from "../authenticateOperator";

const defaultPolicy: AssortmentPolicy = {
    archived: false,
    allowForking: true,
};

export async function createAssortment(request: CreateAssortment): Promise<MaltaaAction> {
    const auth = await authenticateOperator(request);
    if (!auth) {
        return {
            type: "GenericError",
            reason: "Authorization failed",
        };
    }
    const {account, operator} = auth;
    if (!account.mattersIds.includes(operator)) {
        return {
            type: "GenericError",
            reason: "Doesn't control operator user",
        };
    }
    const existing = await db.assortment.findByIdentifier({
        owner: operator,
        subpath: request.subpath,
        contentType: request.contentType,
    });
    if (existing) {
        return {
            type: "GenericError",
            reason: "Path taken",
        };
    }
    let items: AssortmentItem[] = [];
    if (request.upstreams.length) {
        const upstreams = await db.assortment.findByIds(request.upstreams);
        if (upstreams.some(upstream => !upstream.policy.allowForking)) {
            return {
                type: "GenericError",
                reason: "Forking forbidden for some upstream",
            };
        }
        items = upstreams.map(upstream => upstream.items).flat();
    }
    const newAssortment: Assortment = {
        id: uuidv4(),
        title: request.title,
        subpath: request.subpath,
        mattersArticleBaseId: null,
        owner: operator,
        editors: [operator],
        upstreams: request.upstreams,
        contentType: request.contentType,
        description: "",
        items,
        policy: defaultPolicy,
    };
    await db.assortment.upsert(newAssortment);
    return {
        type: "ProvideEntities",
        data: {
            assortments: [
                newAssortment,
            ],
        },
    };
}