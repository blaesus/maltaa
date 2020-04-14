import { } from "./data-types";
import { ArticleId, UserId } from "./Article";

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

export interface AssortmentIdentifier {
    owner: UserId,
    contentType: AssortmentContentType
    subpath: string,
}

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
