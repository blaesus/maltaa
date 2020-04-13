import { dedupe, getFallbackPreferences, protectAccountFromSelf } from "../../utils";
import {db} from "../db";
import { Account, PasswordRecord, Preferences, Privileges, ScryptRecord } from "../../definitions/data-types";
import { v4 as uuidv4 } from "uuid";
import {MaltaaAction, Register} from "../../definitions/actions";
import { createToken, hashPassword, randomString } from "../serverUtils";
import {getMyId, loginToMatters} from "../matters-graphq-api";
import {AuthToken} from "../../definitions/authToken";
import {spiderCommander} from "../spider-commander";
import { SCRYPT_KEYLEN, SCRYPT_SALT_LENGTH } from "../../settings";


async function makeAccount(params: {
    username: string,
    password: string,
    preferences?: Preferences,
}): Promise<{account: Account, token: AuthToken}> {
    const {username, password, preferences} = params;
    const accountPreferences = preferences || getFallbackPreferences();
    const privileges: Privileges[] = ["normal"];
    const salt = await randomString(SCRYPT_SALT_LENGTH);
    const passwordHash = await hashPassword(password, salt, SCRYPT_KEYLEN);
    const passwordRecord: ScryptRecord = {
        type: "scrypt",
        hash: passwordHash,
        keylen: SCRYPT_KEYLEN,
        salt,
    }
    const account: Account = {
        id: uuidv4(),
        username,
        privileges,
        preferences: accountPreferences,
        password: passwordRecord,
        mattersIds: [],
        mattersTokens: {},
        publicKeys: [],
    };
    const token: AuthToken = createToken(account.id);
    return {
        account,
        token,
    }
}

async function registerMaltaa(request: Register): Promise<MaltaaAction> {
    const {username, password, preferences} = request;
    const existing = await db.account.findByUserName(username);
    if (existing) {
        return {
            type: "GenericError",
            reason: "duplicated username"
        }
    }
    const {account, token} = await makeAccount({username, password, preferences});
    await db.account.upsert(account);
    await db.token.upsert(token);
    return {
        type: "ProvideEntities",
        data: {
            me: protectAccountFromSelf(account),
        },
        meta: {
            token,
        }
    }
}

async function registerMatters(request: Register): Promise<MaltaaAction> {
    const result = await loginToMatters({
        email: request.username,
        password: request.password,
    })
    if (!result) {
        return {
            type: "GenericError",
            reason: "Auth failed"
        }
    }
    const myMattersId = await getMyId(result.token);
    if (!myMattersId) {
        return {
            type: "GenericError",
            reason: "Can't get my ID"
        }
    }
    const existing = await db.account.findByMattersId(myMattersId);
    if (existing) {
        return {
            type: "GenericError",
            reason: "Matters ID conflict"
        }
    }
    !!spiderCommander.addUser(myMattersId);
    const users = await db.user.findByIds([myMattersId]);
    const existingAccount = request?.meta?.account;
    if (existingAccount) {
        const account = await db.account.findById(existingAccount);
        if (!account) {
            return {
                type: "GenericError",
                reason: "Don't know you"
            }
        }
        account.mattersIds.push(myMattersId);
        account.mattersIds = account.mattersIds.filter(dedupe);
        await db.account.upsert(account);
        return {
            type: "ProvideEntities",
            data: {
                me: protectAccountFromSelf(account),
                users,
            },
        }
    }
    else {
        const username = uuidv4();
        const password = request.password;
        const preferences = request.preferences;
        const {account, token} = await makeAccount({username, password, preferences});
        account.mattersIds.push(myMattersId);
        account.mattersIds = account.mattersIds.filter(dedupe);
        await db.account.upsert(account);
        await db.token.upsert(token);
        return {
            type: "ProvideEntities",
            data: {
                me: protectAccountFromSelf(account),
                users,
            },
            meta: {
                token,
            }
        }
    }
}

export async function register(request: Register): Promise<MaltaaAction> {
    switch (request.externalPlatform) {
        case "matters": {
            return registerMatters(request);
        }
        default: {
            return registerMaltaa(request);
        }
    }
}