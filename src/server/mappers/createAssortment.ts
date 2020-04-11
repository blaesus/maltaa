import { v4 as uuidv4 } from "uuid";
import { db } from "../db";

import { CreateAssortment, MaltaaAction } from "../../definitions/actions";
import { Assortment } from "../../definitions/assortment";

export async function createAssortment(request: CreateAssortment): Promise<MaltaaAction> {
    const account = request?.meta?.account;
    if (!account) {
        return {
            type: "GenericError",
            reason: "Not authenticated"
        }
    }
    const newAssortment: Assortment = {
        id: uuidv4(),
        mattersArticleBaseId: null,
        owner: account,
        editors: [],
        upstreams: request.upstreams,
        limitContentType: request.limitContentType,
        title: request.title,
        items: [],
    }

    await db.assortment.upsert(newAssortment);
    return {
        type: "ProvideEntities",
        data: {
            assortments: [newAssortment],
        }
    }

}