import { db } from "../db";
import { MaltaaAction, ViewUser } from "../../definitions/Actions";
import { dedupe } from "../../utils";

export async function viewUser(request: ViewUser): Promise<MaltaaAction> {
    const user = await db.user.findByUserName(request.username);
    if (!user) {
        return {
            type: "GenericError",
            reason: "user not found",
        };
    }
    const assortments = await db.assortment.findByItemIds([user.id]);
    const assortmentControllers = assortments.map(a => [a.owner, ...a.editors]).flat().filter(dedupe);
    const relevantUsers = await db.user.findByIds(assortmentControllers);
    return {
        type: "ProvideEntities",
        data: {
            users: [user, ...relevantUsers],
            assortments,
        },
    };
}