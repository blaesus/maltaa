import * as React from "react";
import { useEffect } from "react";

import "./Podium.css"

import { PodiumPageState } from "../../states/uiReducer";
import { ClientState } from "../../states/reducer";
import { MaltaaAction } from "../../../../definitions/Actions";

import { ArticleList } from "../ArticleList/ArticleList";
import { PodiumPeriodChooser, PodiumSortChooser } from "../PreferenceChoosers";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import { DAY, readableDateTime } from "../../../../utils";

export function BacktrackDisplay(props: {
    backtrack: number
}) {
    const now = Date.now();
    const backtractLimit = now - DAY * props.backtrack;
    return (
        <span className="BackTrackDisplay">
            {readableDateTime(backtractLimit, true)}
        </span>
    )
}

function daysInMonth(backtrack: number, monthOffset: number) {
    const current = new Date(Date.now() - backtrack * DAY);
    const date = new Date(current);
    date.setMonth(date.getMonth() + monthOffset);
    return Math.round((+current - +date) / DAY);
}

export function Podium(props: {
    page: PodiumPageState,
    state: ClientState,
    dispatch(action: MaltaaAction): void
}) {
    const {dispatch, page, state} = props;
    const {sort, period, backtrack} = state.ui.pages.podium;


    if (state.ui.pages.current !== "podium") {
        return null;
    }

    return (
        <div className="Podium">
            <nav className="CursorSettings">
                <PodiumSortChooser
                    chosen={sort}
                    onChange={nextSort => {
                        dispatch({
                            type: "SetPodiumCursor",
                            sort: nextSort,
                            period,
                            backtrack,
                        });
                    }}
                />
                <PodiumPeriodChooser
                    chosen={period}
                    onChange={newPeriod => {
                        dispatch({
                            type: "SetPodiumCursor",
                            sort: sort,
                            period: newPeriod,
                            backtrack,
                        });
                    }}
                />
                <span className="TimeMachineDate">
                    <AnchorButton onClick={() => {
                        const delta = daysInMonth(backtrack, -1);
                        dispatch({
                            type: "SetPodiumCursor",
                            sort,
                            period,
                            backtrack: backtrack + delta,
                        });
                    }}>
                        {"<<"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        dispatch({
                            type: "SetPodiumCursor",
                            sort,
                            period,
                            backtrack: backtrack + 1,
                        });
                    }}>
                        {"<"}
                    </AnchorButton>
                    <BacktrackDisplay backtrack={backtrack}/>
                    <AnchorButton onClick={() => {
                        dispatch({
                            type: "SetPodiumCursor",
                            sort,
                            period,
                            backtrack: Math.max(0, backtrack - 1),
                        });
                    }}>
                        {">"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        const delta = daysInMonth(backtrack, 1);
                        dispatch({
                            type: "SetPodiumCursor",
                            sort,
                            period,
                            backtrack: Math.max(0, backtrack + delta),
                        });
                    }}>
                        {">>"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        dispatch({
                            type: "SetPodiumCursor",
                            sort,
                            period,
                            backtrack: 0,
                        });
                    }}>
                        {"0"}
                    </AnchorButton>

                </span>
            </nav>
            <ArticleList
                mode="podium"
                state={props.state}
                dispatch={dispatch}
            />
        </div>
    )
}
