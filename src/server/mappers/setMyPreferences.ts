import { db } from "../db";
import { MaltaaAction, SetMyPreferences } from "../../definitions/Actions";

export async function setMyPreferences(request: SetMyPreferences): Promise<MaltaaAction> {
    const accountId = request?.meta?.account;
    if (!accountId) {
        return {
            type: "GenericError",
            reason: "Can't authenticate",
        };
    }
    const account = await db.account.findById(accountId);
    if (!account) {
        return {
            type: "GenericError",
            reason: "Don't know you",
        };
    }
    account.preferences = {
        ...account.preferences,
        ...request.preferencesPatch,
    };
    await db.account.upsert(account);
    return {
        type: "ProvideEntities",
        data: {
            me: account,
        },
    };
}