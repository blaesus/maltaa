import {ArticleId, UserId, Account, AccountId} from "./data-types";

type ContentType = "article" | "user"

export interface MattersEntity {
    source: "matters",
    entityType: ContentType,
    id: ArticleId | UserId,
    addedBy: UserId,
    addedAt: number,
}

export type AssortmentItem = MattersEntity;

export type AssortmentId = string;

export interface Assortment {
    id: Assortment,
    mattersArticleBaseId: ArticleId | null,
    owner: UserId,
    editors: UserId[],
    upstreams: AssortmentId[],
    limitContentType: ContentType | null,
    title: string,
    articles: AssortmentItem[],
}
