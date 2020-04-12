import { ArticleId, UserId } from "./data-types";

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

export type AssortmentContentType = MattersEntityType | "mixed";

export interface Assortment {
    id: AssortmentId,
    title: string,
    subpath: string,
    mattersArticleBaseId: ArticleId | null,
    owner: UserId,
    editors: UserId[],
    upstreams: AssortmentId[],
    contentType: AssortmentContentType,
    items: AssortmentItem[],
}
