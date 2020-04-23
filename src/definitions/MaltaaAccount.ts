import { Preferences } from "./Preferences";
import { UserId } from "./User";

interface TokenRecord {
    content: string,
    expiration: number,
}

interface RSAPublicKeyRecord {
    type: "RSA",
    key: string,
}

type PublicKeyRecord = RSAPublicKeyRecord;

export type Privileges = "admin" | "normal"

export interface ScryptRecord {
    type: "scrypt",
    hash: string,
    keylen: number,
    salt: string,
}

export type PasswordRecord = ScryptRecord;

export type AccountId = string;

export interface MaltaaAccount {
    id: AccountId,
    username: string,
    privileges: Privileges[],
    preferences: Preferences,

    password: PasswordRecord,
    mattersIds: UserId[],
    mattersTokens: {[key in UserId]: TokenRecord}
    publicKeys: PublicKeyRecord[],
}

export type AccountSelf = Pick<MaltaaAccount,
    "id" | "username" | "privileges" | "mattersIds" | "preferences"
>;

