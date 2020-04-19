import { GetMyData, MaltaaAction } from "../../definitions/Actions";
import { db } from "../db";

export async function getMyData(request: GetMyData): Promise<MaltaaAction> {
    const account = request?.meta?.account;
    if (!account) {
        return {
            type: "GenericError",
            reason: "I don't know you",
        };
    }
    const me = await db.account.findById(account);
    if (!me) {
        return {
            type: "GenericError",
            reason: "I can't find you",
        };
    }
    const myUsers = await db.user.findByIds(me.mattersIds);
    console.info(me);
    const myAssortments = await db.assortment.findByOwners(me.mattersIds);
    return {
        type: "ProvideEntities",
        data: {
            me,
            users: myUsers,
            assortments: myAssortments,
        },
    };
}