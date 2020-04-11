import {getFallbackPreferences, protectAccountFromSelf} from "../../utils";
import {db} from "../db";
import {Account, PasswordRecord, Preferences, Privileges} from "../../definitions/data-types";
import { v4 as uuidv4 } from "uuid";
import {MaltaaAction, Register} from "../../definitions/actions";
import {randomString} from "../serverUtils";
import {SCRYPT_KEYLEN, SCRYPT_SALT_LENGTH} from "../../settings";
import {BinaryLike, scrypt} from "crypto";
import {getMyId, loginToMatters} from "../matters-graphq-api";
import {AuthToken} from "../../definitions/authToken";
import {Token} from "graphql";

async function scryptAsync(
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, keylen, (error, derivedKey) => {
            if (error) {
                reject(error)
            }
            else {
                resolve(derivedKey)
            }
        })
    })
}

async function hashPassword(password: string): Promise<PasswordRecord> {
    const salt = randomString(SCRYPT_SALT_LENGTH);
    const keylen = SCRYPT_KEYLEN;
    const hash = (await scryptAsync(password, salt, keylen)).toString("hex");
    return {
        type: "scrypt",
        hash,
        salt,
        keylen,
    }
}

async function makeAccount(params: {
    username: string,
    password: string,
    preferences?: Preferences,
}): Promise<{account: Account, token: AuthToken}> {
    const {username, password, preferences} = params;
    const accountPreferences = preferences || getFallbackPreferences();
    const privileges: Privileges[] = ["normal"];
    const account: Account = {
        id: uuidv4(),
        username,
        privileges,
        preferences: accountPreferences,
        password: await hashPassword(password),
        mattersIds: [],
        mattersTokens: {},
        publicKeys: [],
    };
    const token: AuthToken = {
        id: uuidv4(),
        holder: account.id,
        secret: randomString(32),
    };
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
    const username = uuidv4();
    const password = request.password;
    const preferences = request.preferences;
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