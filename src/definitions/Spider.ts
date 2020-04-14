import { TagId } from "./data-types";
import { ArticleId, UserId } from "./Article";

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

export type SpiderRecordEntity = SpiderRecordEntityArticle | SpiderRecordEntityTag | SpiderRecordEntityUser;


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
}

export type SpiderRecord = SpiderRecordEntity | SpiderState;
