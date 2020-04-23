import * as React from "react";

import "./Podium.css";

import { PodiumPageState } from "../../states/uiReducer";
import { ClientState } from "../../states/reducer";

import { ArticleListCursorControl } from "../ArticleList/ArticleListCursorControl";
import { MaltaaDispatch } from "../../uiUtils";
import { ArticleList } from "../ArticleList/ArticleList";

export function Podium(props: {
    page: PodiumPageState,
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {dispatch, page, state} = props;
    const {sort, period, backtrack} = state.ui.pages.podium;

    if (state.ui.pages.current !== "podium") {
        return null;
    }

    return (
        <div className="Podium">
            <ArticleListCursorControl
                mode="podium"
                listSetting={state.ui.pages.podium}
                dispatch={dispatch}
            >
                <ArticleList
                    mode="podium"
                    state={props.state}
                    dispatch={dispatch}
                />
            </ArticleListCursorControl>
        </div>
    );
}
