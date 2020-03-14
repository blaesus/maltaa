export type UserId = string;
export type CommentId = string
export type TransactionMaltaId = string;

export interface Comment {
    id: CommentId,
    createdAt: number,
    content: string,
    author: string,
    parent: string,
    replyTarget: string | null,
}

export interface Article {
    mediaHash: string,
    id: string,
    topicScore: number
    slug: string,
    createdAt: number,
    title: string,
    state: string,
    public: boolean,
    live: boolean,
    cover: string | null,
    summary: string,
    author: string,
    dataHash: string,
    sticky: boolean,
    content: string,
    tags: string[],
    comments: CommentId[],
    appreciations: TransactionMaltaId[],
    remark: string,
    relatedArticles: string[],
}

export interface Transaction {
    mid: TransactionMaltaId, // Custom ID
    amount: number,
    createdAt: number,
    sender: UserId,

    // These properties are listed in documentation but throw error upon query
    target: string,
    recipient: string,
    purpose: never,
}

export interface Tag {
    id: string,
    content: string,
}

export interface UserPublic {
    id: UserId,
    uuid: string,
    userName: string,
    displayName: string,
    avatar: string,
    info: {
        createdAt: number,
        userNameEditable: boolean,
        description: string,
        agreeOn: number,
        profileCover: string | null,
    },
    followees: UserId[]
    status: {
        state: "active" | "onboarding" | "banned" | "frozen" | "archived",
        role: "admin" | "user",
        unreadFolloweeArticles: boolean,
        unreadResponseInfoPopup: boolean,
    },
}

export interface SpiderRecordEntity {
    entityId: string,
    type: "article" | "user",
    lastFetch: number,
}

export interface SpiderState {
    type: "spider-state",
    entityId: "spider-state"
    cursor: string,
    mhsToFetch: string[],
    userIdsToFetch: string[],
}

export type SpiderRecord = SpiderRecordEntity | SpiderState;
