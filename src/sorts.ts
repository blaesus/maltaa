import { Article, Comment } from "./definitions/Article";

export type ArticleSort = "comments" | "recent" | "old" | "appreciationAmount" | "random"

export type CommentSort = "recent" | "old" | "upvotes"

export const commentSorts: {[key in CommentSort]: (a: Comment, b: Comment) => number} = {
    old: (a, b) => a.createdAt - b.createdAt,
    recent: (a, b) => b.createdAt - a.createdAt,
    upvotes: (a, b) => b.derived.upvotes - a.derived.upvotes,
};

export const articleSorts: {[key in ArticleSort]: (a: Article, b: Article) => number} = {
    comments: (a, b) => b.derived.comments - a.derived.comments,
    recent: (a, b) => b.createdAt - a.createdAt,
    old: (a, b) => a.createdAt - b.createdAt,
    appreciationAmount: (a, b) => b.derived.appreciationAmount - a.derived.appreciationAmount,
    random: (a, b) => Math.random() - 0.5,
};
