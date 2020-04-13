import { db } from "../db";

import { MaltaaAction, UpdateAssortment } from "../../definitions/actions";
import { MattersEntity, MattersEntityType } from "../../definitions/assortment";

export async function updateAssortment(request: UpdateAssortment): Promise<MaltaaAction> {
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
    const user = request.meta?.asUser;
    if (!user) {
        return {
            type: "GenericError",
            reason: "No user claimed"
        }
    }
    if (!account.mattersIds.includes(user)) {
        return {
            type: "GenericError",
            reason: "Doesn't control owner user"
        }
    }
    const target = await db.assortment.findById(request.target);
    if (!target) {
        return {
            type: "GenericError",
            reason: "Can't find it"
        }
    }
    switch (request.operation) {
        case "AddItem": {
            if (target.items.some(item => item.id === request.item.id)) {
                return {
                    type: "GenericError",
                    reason: "Cannot add duplicated item"
                }
            }
            const newItem: MattersEntity = {
                source: "matters",
                entityType: request.item.entityType,
                id: request.item.id,
                note: "",
                addedBy: user,
                addedAt: Date.now(),
            }
            target.items.push(newItem);
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                }
            }
        }
    }
}