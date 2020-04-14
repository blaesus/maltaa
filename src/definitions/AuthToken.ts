import { AccountId } from "./MaltaaAccount";

export type AuthTokenId = string;

export interface AuthToken {
    id: AuthTokenId,
    holder: AccountId,
    secret: string,
    valid: boolean,
    created: number,
}