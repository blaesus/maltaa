import { CommentContent } from "./CommentTree/CommentContent";
import { ArticleSummary } from "../ArticleSummary/ArticleSummary";
import * as React from "react";
import { Article, Comment } from "../../../../definitions/Article";
import { UserPublic } from "../../../../definitions/User";
import { MaltaaDispatch } from "../../uiUtils";

export function CommentContentWithBackground(props: {
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
            ResponseBackground={
                <section className="ResponseBase">
                    {
                        rootArticle && articleAuthor &&
                        <ArticleSummary
                            article={rootArticle}
                            author={articleAuthor}
                        />
                    }
                    <div style={
                        {
                            fontSize: "0.9em",
                            background: "#eee",
                        }
                    }>
                        {
                            replyTarget && replyTargetAuthor &&
                            <CommentContent
                                comment={replyTarget}
                                author={replyTargetAuthor}
                            />
                        }
                    </div>
                </section>
            }
        />
    )
}