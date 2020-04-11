import { UserPublic } from "./data-types";

export interface RegisterFromMattersParams {
    mattersEmail: string,
    mattersPassword: string,
}

export interface RegisterFromMattersOk {
    ok: true,
    me: UserPublic,
}
