import {db} from "../db";
import { MaltaaAction, Signin } from "../../definitions/actions";
import { createToken, hashPassword } from "../serverUtils";

export async function signin(request: Signin): Promise<MaltaaAction> {
    const account = await db.account.findByUserName(request.username);
    if (!account) {
        return {
            type: "GenericError",
            reason: "Can't authenticate"
        }
    }
    const hash = await hashPassword(request.password, account.password.salt, account.password.keylen);
    if (hash !== account.password.hash) {
        return {
            type: "GenericError",
            reason: "Can't authenticate"
        }
    }
    const token = await createToken(account.id);
    await db.token.upsert(token);
    return {
        type: "ProvideEntities",
        data: {
            me: account,
        },
        meta: {
            token,
        }
    }
}