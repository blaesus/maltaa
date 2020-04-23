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
                sort={sort}
                period={period}
                backtrack={backtrack}
                onChooseSort={nextSort => {
                    dispatch({
                        type: "SetPodiumCursor",
                        sort: nextSort,
                        period,
                        backtrack,
                    });
                }}
                onChoosePeriod={newPeriod => {
                    dispatch({
                        type: "SetPodiumCursor",
                        sort: sort,
                        period: newPeriod,
                        backtrack,
                    });
                }}
                onSetBacktrackDifference={delta => {
                    dispatch({
                        type: "SetPodiumCursor",
                        sort,
                        period,
                        backtrack: Math.max(backtrack - delta, 0),
                    });
                }}
                onResetBacktrack={() => {
                    dispatch({
                        type: "SetPodiumCursor",
                        sort,
                        period,
                        backtrack: 0,
                    });
                }}
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
