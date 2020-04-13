import {ArticleSort, CommentSort} from "../sorts";
import {AuthToken} from "./authToken";

export type UserId = string;
export type CommentId = string
export type TransactionMaltaaId = string;
export type TagId = string;
export type ArticleId = string;

export interface Comment {
    id: CommentId,
    state: "active" | "archived" | "banned" | "collapsed",
    createdAt: number,
    content: string,
    author: string,
    parent: string,
    replyTarget: string | null,

    // Newly added, to await data sync
    derived?: {
        upvotes: number,
        downvotes: number,
    }
}

export interface Article {
    id: ArticleId,
    mediaHash: string,
    topicScore: number | null,
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
    upstreams: ArticleId[],
    subscribers: UserId[],
    remark: string,

    // "Selected by author"
    // Newly added, to await data sync
    pinnedComments?: CommentId[],

    derived: {
        comments: number,
        commenters: number,
        appreciations: number,
        appreciationAmount: number,
        appreciators: number,

        // "Selected by community"
        // Newly added, to await data sync
        featuredComments?: CommentId[],
    }
}

type License =
    "UNLICENSED"
    | "NOCLAIM"
    | "CC BY-SA"
    | "CC BY-ND"
    | "CC BY-NC"
    | "CC BY-NC-SA"
    | "CC BY-NC-ND"
    | "CC0"
;

export interface ArticleSupplement {
    license: License,
    canon: string | null,
    editors: UserId[],
    newVersions: {
        time: number,
        content: string,
        editor: UserId,
    }[],
}

export interface Transaction {
    mid: TransactionMaltaaId, // Custom ID
    amount: number,
    createdAt?: number,
    sender: UserId,

    // These properties are listed in documentation but throw error upon query
    target: string,
    recipient: string,
    purpose: never,
}

export interface Tag {
    id: TagId,
    content: string,
    createdAt: number,
    cover: string | {},
    description: string | null,
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

export type RoomId = string;

interface Room {
    id: RoomId,
    mattersArticleBaseId: string,
    owner: UserId,
    admins: UserId[],
    name: string,
    openForSubmission: boolean,
    adultOnly: boolean,
}

interface TokenRecord {
    content: string,
    expiration: number,
}

interface RSAPublicKeyRecord {
    type: "RSA",
    key: string,
}

type PublicKeyRecord = RSAPublicKeyRecord;

interface MattersAuth {
    id: UserId,
    tokens: TokenRecord[],
}

export type Privileges = "admin" | "normal"

export interface ScryptRecord {
    type: "scrypt",
    hash: string,
    keylen: number,
    salt: string,
}

export type PasswordRecord = ScryptRecord;

export type AccountId = string;

export interface Account {
    id: AccountId,
    username: string,
    privileges: Privileges[],
    preferences: Preferences,

    password: PasswordRecord,
    mattersIds: UserId[],
    mattersTokens: {[key in UserId]: TokenRecord}
    publicKeys: PublicKeyRecord[],
}

export type AccountSelf = Pick<Account,
    "id" | "username" | "privileges" | "mattersIds" | "preferences"
>;


interface Roll {
    id: string,
    mattersArticleBaseId: ArticleId,
    owner: UserId,
    members: UserId[],
}

interface ChatMessage {
    id: string,
    mattersCommentBaseId: CommentId | null,
    sender: UserId,
    receiver: UserId,
    messageType: "plain"
    messageBody: string,
}

interface MaltaUserPreference {
    mattersArticleBaseId: ArticleId,
    blockedNameLists: string[],
    followedNameLists: string[],
}

interface EnhancedComment extends Comment {
    maltaa?: {
        targetSegment: {
            article: ArticleId,
            offset: number,
            length: number,
            text: string,
        } | null
    }
}

interface UserRecommendation {
    id: string,
    mattersArticleBaseId: ArticleId,
    target: UserId,
    issuer: UserId,
    time: number,
    comment: string,
}

export type ObjectWithId = {id: string}

export type ObjectMap<T extends ObjectWithId> = {[key in string]: T};

export interface LeveledCommentPreferences {
    sort: CommentSort,
    displayThreshold: number,
}

export interface Preferences {
    version: number,

    data: {
        screenedUsers: UserId[],
        screenedTags: TagId[],
        followedUsers: UserId[],
    }

    styles: {
        customCSS: string,
    }

    podium: {
        defaultSort: ArticleSort,
        defaultPeriod: number,
        hoverPreview: boolean,
    },

    articles: {
        showUpstreams: boolean,
        showDownstreams: boolean,
        showMattersLink: boolean,
        showArticleDevInfo: boolean,
        appreciateMaxButton: boolean,
    },

    comments: {
        firstLevel: LeveledCommentPreferences,
        secondLevel: LeveledCommentPreferences,
    },

    identity: {
        operator: UserId | null,
    },

    privacy: {
        doNotTrack: 0 | 1 | null,
    },
}

export interface SiteConfig {
    syncFromMatters: boolean,
    syncToMatters: boolean,
}
