import { CommentListCursorControl } from "./CommentListCursorControl";
import { CommentContent } from "../ArticlePage/CommentTree/CommentContent";
import * as React from "react";
import { ClientState } from "../../states/reducer";
import { MaltaaDispatch } from "../../uiUtils";
import { UserPublic } from "../../../../definitions/User";
import { useEffect } from "react";
import { commentSorts } from "../../../../sorts";
import { ListButton } from "../ListButton/ListButton";
import { ArticleSummary } from "../ArticleSummary/ArticleSummary";

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
                              const replyTarget = c.replyTarget && state.entities.comments[c.replyTarget];
                              const replyTargetAuthor = replyTarget && state.entities.users[replyTarget.author];
                              return (
                                  <CommentContent
                                      key={c.id}
                                      comment={c}
                                      author={user}
                                      fallbackWidth={pageWidth}
                                      onAuthorClick={() => {
                                          dispatch({type: "ViewUser", username: user.userName})
                                      }}
                                      ResponseBase={
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