import { BinaryLike, randomBytes, scrypt } from "crypto";

import { v4 as uuidv4 } from "uuid";

import { AccountId } from "../definitions/data-types";
import { SCRYPT_KEYLEN } from "../settings";
import { AuthToken } from "../definitions/authToken";

export const btoa = (s: string) => Buffer.from(s).toString("base64");
export const atob = (s: string) => Buffer.from(s, "base64").toString();

export function randomString(bytes: number): string {
    return randomBytes(bytes).toString("base64");
}

async function scryptAsync(
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, keylen, (error, derivedKey) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(derivedKey);
            }
        });
    });
}

export async function hashPassword(
    password: string,
    salt: string,
    keylen = SCRYPT_KEYLEN,
): Promise<string> {
    return (await scryptAsync(password, salt, keylen)).toString("base64");
}


export function createToken(holder: AccountId): AuthToken {
    return {
        id: uuidv4(),
        holder,
        secret: randomString(32),
        valid: true,
        created: Date.now(),
    };

}
