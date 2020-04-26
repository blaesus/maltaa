import * as React from "react";

import "./CommentContentWithResponseBackground.css"

import { Article, Comment } from "../../../../definitions/Article";
import { UserPublic } from "../../../../definitions/User";
import { MaltaaDispatch } from "../../uiUtils";

import { CommentContent } from "./CommentContent";
import { ArticleSummary } from "../ArticleSummary/ArticleSummary";

export function CommentContentWithResponseBackground(props: {
    comment: Comment,
    commentAuthor: UserPublic,

    rootArticle?: Article | null,
    articleAuthor?: UserPublic | null,
    replyTarget?: Comment | null,
    replyTargetAuthor?: UserPublic | null,

    dispatch: MaltaaDispatch,
    fallbackWidth?: number,
}) {
    const {comment, commentAuthor, dispatch, rootArticle, articleAuthor, replyTarget, replyTargetAuthor, fallbackWidth} = props;
    return (
        <CommentContent
            comment={comment}
            author={commentAuthor}
            fallbackWidth={fallbackWidth}
            onAuthorClick={() => {
                dispatch({type: "ViewUser", username: commentAuthor.userName})
            }}
            preamble={
                <section className="ResponseBackground">
                    {
                        rootArticle && articleAuthor &&
                        <ArticleSummary
                            article={rootArticle}
                            author={articleAuthor}
                        />
                    }
                    {
                        replyTarget && replyTargetAuthor &&
                        <CommentContent
                            comment={replyTarget}
                            author={replyTargetAuthor}
                        />
                    }
                </section>
            }
        />
    )
}