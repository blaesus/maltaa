import { db } from "../db";
import { MaltaaAction, ViewUser } from "../../definitions/Actions";

export async function viewUser(request: ViewUser): Promise<MaltaaAction> {
    const user = await db.user.findByUserName(request.username);
    if (!user) {
        return {
            type: "GenericError",
            reason: "user not found",
        };
    }
    return {
        type: "ProvideEntities",
        data: {
            users: [user],
        },
    };
}