import { ArticleId } from "./Article";
import { UserId } from "./User";

export type MattersEntityType = "article" | "user"

export interface AssortmentBaseItem {
    id: ArticleId | UserId,

    collector: UserId,
    collectionTime: number,

    review: string,
    lastReviewer: UserId,
    lastReviewTime: number,
}

export interface MattersEntityItem extends AssortmentBaseItem {
    source: "matters",
    entityType: MattersEntityType,
}

export type AssortmentItem = MattersEntityItem;

export type AssortmentId = string;

export type AssortmentContentType = "anthology" | "roll" | "mixture";

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
