import * as React from "react";

import "./CommentListCursorControl.css";

import { CommentSortChooser } from "../PreferenceChoosers";
import { ListSetting } from "../../states/uiReducer";
import { MaltaaDispatch } from "../../uiUtils";
import { CommentSort } from "../../../../sorts";

export function CommentListCursorControl(props: {
    listSetting: ListSetting<CommentSort>,
    dispatch: MaltaaDispatch,
    children?: React.ReactNode,
}) {
    const {dispatch} = props;
    const {sort} = props.listSetting;

    return (
        <div className="CommentListCursorControl">
            <nav className="CursorSettings">
                <CommentSortChooser
                    chosen={sort}
                    onChange={nextSort => {
                        dispatch({
                            type: "SetUserCommentCursor",
                            sort: nextSort,
                        });
                    }}
                />
            </nav>
            {props.children}
        </div>
    );
}
