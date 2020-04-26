import { CommentListCursorControl } from "./CommentListCursorControl";
import { CommentContent } from "../ArticlePage/CommentTree/CommentContent";
import * as React from "react";
import { ClientState } from "../../states/reducer";
import { MaltaaDispatch } from "../../uiUtils";
import { UserPublic } from "../../../../definitions/User";
import { useEffect } from "react";
import { commentSorts } from "../../../../sorts";
import { ListButton } from "../ListButton/ListButton";

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
                          .map(c => (
                              <CommentContent
                                  key={c.id}
                                  comment={c}
                                  author={user}
                                  fallbackWidth={pageWidth}
                                  onAuthorClick={() => {}}
                              />
                          ))
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