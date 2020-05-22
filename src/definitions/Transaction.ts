import { UserId } from "./User";

export type TransactionMaltaaId = string;

export interface Transaction {
    mid: TransactionMaltaaId, // Custom ID
    amount: number,
    createdAt: number,
    sender: UserId,

    // These properties are listed in documentation but throw error upon query
    target: string,
    recipient: string,
    purpose: never,
}

