import { ArticleId } from "./Article";
import { UserId } from "./User";

export type MattersEntityType = "article" | "user"

export interface MattersEntity {
    source: "matters",
    entityType: MattersEntityType,
    id: ArticleId | UserId,
    review: string,

    collector: UserId,
    collectionTime: number,

    lastReviewer: UserId,
    lastReviewTime: number,
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
    archived: boolean,
    description: string,
    owner: UserId,
    editors: UserId[],
    upstreams: AssortmentId[],
    contentType: AssortmentContentType,
    items: AssortmentItem[],
}
