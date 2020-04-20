import { MaltaaAction } from "../definitions/Actions";
import { db } from "./db";
import { UserId } from "../definitions/User";
import { MaltaaAccount } from "../definitions/MaltaaAccount";

export async function authenticateOperator(request: MaltaaAction): Promise<{ operator: UserId, account: MaltaaAccount } | null> {
    const accountId = request?.meta?.account;
    if (!accountId) {
        return null;
    }
    const account = await db.account.findById(accountId);
    if (!account) {
        return null;
    }
    const operator = request.meta?.operator;
    if (!operator) {
        return null;
    }
    if (!account.mattersIds.includes(operator)) {
        return null;
    }
    return {
        account,
        operator,
    };
}