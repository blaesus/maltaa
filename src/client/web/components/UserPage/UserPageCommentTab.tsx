import { CommentListCursorControl } from "./CommentListCursorControl";
import { CommentContent } from "../Comments/CommentContent";
import * as React from "react";
import { ClientState } from "../../states/reducer";
import { MaltaaDispatch } from "../../uiUtils";
import { UserPublic } from "../../../../definitions/User";
import { useEffect } from "react";
import { commentSorts } from "../../../../sorts";
import { ListButton } from "../ListButton/ListButton";
import { ArticleSummary } from "../ArticleSummary/ArticleSummary";
import { CommentContentWithResponseBackground } from "../Comments/CommentContentWithResponseBackground";

export function UserPageCommentTab(props: {
    user: UserPublic,
    state: ClientState,
    pageWidth?: number,
    dispatch: MaltaaDispatch,
}) {
    const {user, pageWidth, state, dispatch} = props;

    const commentPage = state.ui.pages.user.comments;
    const {sort} = commentPage;

    useEffect(() => {
        dispatch({
            type: "LoadComments",
            sort: commentPage.sort,
            pageNumber: commentPage.pagination.nextPage,
            author: user.id,
        })
    }, [commentPage.sort])
    return (
        <section className="UserPageCommentTab">
            <CommentListCursorControl
                listSetting={commentPage}
                dispatch={dispatch}
            >
                {
                    Object.values(state.entities.comments)
                          .filter(c => commentPage.pagination.receivedItems.includes(c.id))
                          .filter(c => c.author === user.id)
                          .sort(commentSorts[sort])
                          .map(c => {
                              const rootArticle = state.entities.articles[c.derived.root];
                              const articleAuthor = state.entities.users[rootArticle?.author];
                              const replyTarget = c.replyTarget ? state.entities.comments[c.replyTarget] : null;
                              const replyTargetAuthor = replyTarget ? state.entities.users[replyTarget.author] : null;
                              return (
                                  <CommentContentWithResponseBackground
                                      key={c.id}
                                      comment={c}
                                      commentAuthor={user}
                                      rootArticle={rootArticle}
                                      articleAuthor={articleAuthor}
                                      replyTarget={replyTarget}
                                      replyTargetAuthor={replyTargetAuthor}
                                      fallbackWidth={pageWidth}
                                      dispatch={dispatch}
                                  />
                              )
                          })
                }
            </CommentListCursorControl>
            <ListButton
                pagination={commentPage.pagination}
                onClick={() => dispatch({
                    type: "LoadComments",
                    sort: commentPage.sort,
                    pageNumber: commentPage.pagination.nextPage,
                    author: user.id,
                })}
            />
        </section>

    )
}