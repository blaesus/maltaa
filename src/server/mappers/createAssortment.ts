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
    const existings = await db.assortment.find({
        owner: account,
        subpath: request.subpath,
        contentType: request.contentType,
    });
    if (existings.length) {
        return {
            type: "GenericError",
            reason: "Path taken",
        }
    }

    const newAssortment: Assortment = {
        id: uuidv4(),
        title: request.title,
        subpath: request.subpath,
        mattersArticleBaseId: null,
        owner: account,
        editors: [account],
        upstreams: request.upstreams,
        contentType: request.contentType,
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