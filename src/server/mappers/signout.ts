import { db } from "../db";
import {CreateAssortment, MaltaaAction, Signout} from "../../definitions/actions";

export async function signout(request: Signout): Promise<MaltaaAction> {
    const account = request?.meta?.account;
    if (!account) {
        return {
            type: "GenericError",
            reason: "Not authenticated",
        }
    }
    const token = request?.meta?.token;
    if (!token) {
        return {
            type: "GenericError",
            reason: "Not authenticated",
        }
    }
    const targetToken = await db.token.findById(token.id);
    if (!targetToken) {
        return {
            type: "GenericError",
            reason: "Not found",
        }
    }
    if (targetToken.holder !== account) {
        return {
            type: "GenericError",
            reason: "Not authorized",
        }
    }
    targetToken.valid = false;
    await db.token.upsert(targetToken);
    return {
        type: "GenericOk",
        meta: {
            token: null,
        }
    }

}

