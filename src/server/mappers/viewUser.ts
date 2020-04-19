import { MaltaaAction, ViewUser } from "../../definitions/Actions";
import { db } from "../db";

export async function viewUser(request: ViewUser): Promise<MaltaaAction> {
    const user = await db.user.findByUserName(request.username);
    if (!user) {
        return {
            type: "GenericError",
            reason: "user not found",
        };
    }
    const assortments = await db.assortment.findByItemIds([user.id]);
    return {
        type: "ProvideEntities",
        data: {
            users: [user],
            assortments,
        },
    };
}