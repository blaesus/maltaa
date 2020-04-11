import {Article, Comment} from "./data-types";

export type ArticleSort = "comments" | "recent" | "appreciationAmount"

export type CommentSort = "recent" | "old"

export const commentSorts: {[key in CommentSort]: (a: Comment, b: Comment) => number} = {
    old: (a, b) => a.createdAt - b.createdAt,
    recent: (a, b) => b.createdAt - a.createdAt,
};

export const articleSorts: {[key in ArticleSort]: (a: Article, b: Article) => number} = {
    comments: (a, b) => b.derived.comments - a.derived.comments,
    recent: (a, b) => b.createdAt - a.createdAt,
    appreciationAmount: (a, b) => b.derived.appreciationAmount - a.derived.appreciationAmount,
};
