import {ArticleId, UserId, Account, AccountId} from "./data-types";

export type MattersEntityType = "article" | "user"

export interface MattersEntity {
    source: "matters",
    entityType: MattersEntityType,
    id: ArticleId | UserId,
    note: string,
    addedBy: UserId,
    addedAt: number,
}

export type AssortmentItem = MattersEntity;

export type AssortmentId = string;

export interface Assortment {
    id: AssortmentId,
    mattersArticleBaseId: ArticleId | null,
    owner: UserId,
    editors: UserId[],
    upstreams: AssortmentId[],
    limitContentType: MattersEntityType | null,
    title: string,
    items: AssortmentItem[],
}
