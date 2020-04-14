import { UserId } from "./User";
import { RoomId } from "./Room";

export type ArticleId = string;
export type CommentId = string

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
    room: RoomId | null,
    canon: string | null,
    editors: UserId[],
    newVersions: {
        time: number,
        content: string,
        editor: UserId,
    }[],
}

