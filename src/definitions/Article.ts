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
    derived: {
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
    author: UserId,
    dataHash: string,
    sticky: boolean,
    content: string,
    tags: string[],
    upstreams: ArticleId[],
    subscribers: UserId[],
    remark: string,

    // "Selected by author"
    pinnedComments: CommentId[],

    derived: {
        comments: number,
        commenters: number,
        appreciations: number,
        appreciationAmount: number,

        // "Selected by community"
        featuredComments: CommentId[],
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

interface ArticleVersion {
    time: number,
    content: string,
    mediaHash: string,
    editor: UserId,
}

export interface ArticleSupplement {
    license: License,
    room: RoomId | null,
    canon: string | null,
    editors: UserId[],
    newVersions: ArticleVersion[],
}

