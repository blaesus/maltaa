import { ArticleId } from "./Article";
import { UserId } from "./User";

export type MattersEntityType = "article" | "user"

export interface AssortmentBaseItem {
    collector: UserId,
    collectionTime: number,

    lastReviewer: UserId,
    lastReviewTime: number,
}

export interface MattersEntityItem extends AssortmentBaseItem {
    source: "matters",
    entityType: MattersEntityType,
    id: ArticleId | UserId,
    review: string,
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
