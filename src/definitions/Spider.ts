import { ArticleId, CommentId } from "./Article";
import { TagId } from "./Tag";
import { UserId } from "./User";

export interface SpiderRecordEntityArticle {
    type: "article",
    entityId: ArticleId,
    lastFetch: number,
    success: boolean,
}

export interface SpiderRecordEntityTag {
    type: "tag",
    entityId: TagId,
    lastFetch: number,
    success: boolean,
}

export interface SpiderRecordEntityUser {
    type: "user"
    entityId: UserId,
    lastFetch: number,
    success: boolean,
}

export interface SpiderRecordEntityComment {
    type: "comment"
    entityId: CommentId,
    lastFetch: number,
    success: boolean,
}

export type SpiderRecordEntity =
    SpiderRecordEntityArticle
    | SpiderRecordEntityTag
    | SpiderRecordEntityUser
    | SpiderRecordEntityComment
    ;


export interface EntityState<IdType extends string> {
    toFetch: IdType[],
    cursor?: string | null,
    fetching: IdType[],
    lastCheckedSerial: number,
    missingOnRemote: IdType[],
}

export interface SpiderState {
    type: "spider-state",
    entityId: "spider-state"
    articles: EntityState<ArticleId>,
    users: EntityState<UserId>,
    tags: EntityState<TagId>,
    comments: EntityState<CommentId>,
}

export type SpiderRecord = SpiderRecordEntity | SpiderState;
