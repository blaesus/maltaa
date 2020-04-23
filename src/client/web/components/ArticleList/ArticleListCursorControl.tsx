import * as React from "react";

import "./ArticleListCursorControl.css";
import { ArticlePeriodChooser, ArticleSortChooser } from "../PreferenceChoosers";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import { DAY, readableDateTime } from "../../../../utils";
import { ArticleSort } from "../../../../sorts";
import { ArticleListSetting } from "../../states/uiReducer";
import { MaltaaDispatch } from "../../uiUtils";

export function BacktrackDisplay(props: {
    backtrack: number
}) {
    const now = Date.now();
    const backtractLimit = now - DAY * props.backtrack;
    return (
        <span className="BackTrackDisplay">
            {readableDateTime(backtractLimit, true)}
        </span>
    );
}

function daysInMonth(backtrack: number, monthOffset: number) {
    const current = new Date(Date.now() - backtrack * DAY);
    const date = new Date(current);
    date.setMonth(date.getMonth() + monthOffset);
    return Math.round((+date - +current) / DAY);
}

export function ArticleListCursorControl(props: {
    mode: "podium" | "user",
    listSetting: ArticleListSetting,
    dispatch: MaltaaDispatch,
    children?: React.ReactNode,
}) {
    const {dispatch, mode} = props;
    const {sort, period, backtrack} = props.listSetting;

    const onSetBacktrackDifference = (delta: number) => {
        dispatch({
            type: "SetArticleCursor",
            mode,
            sort,
            period,
            backtrack: Math.max(backtrack - delta, 0),
        });
    }

    return (
        <div className="ArticleListCursorControl">
            <nav className="CursorSettings">
                <ArticleSortChooser
                    chosen={sort}
                    onChange={nextSort => {
                        dispatch({
                            type: "SetArticleCursor",
                            mode,
                            sort: nextSort,
                            period,
                            backtrack,
                        });
                    }}
                />
                <ArticlePeriodChooser
                    chosen={period}
                    onChange={newPeriod => {
                        dispatch({
                            type: "SetArticleCursor",
                            mode,
                            sort: sort,
                            period: newPeriod,
                            backtrack,
                        });
                    }}
                />
                {
                    typeof backtrack === "number" &&
                    <span className="TimeMachineDate">
                    <AnchorButton onClick={() => {
                        onSetBacktrackDifference(daysInMonth(backtrack, -1));
                    }}>
                        {"<<"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        onSetBacktrackDifference(-1);
                    }}>
                        {"<"}
                    </AnchorButton>
                    <BacktrackDisplay backtrack={backtrack}/>
                    <AnchorButton onClick={() => {
                        onSetBacktrackDifference(+1);
                    }}>
                        {">"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        onSetBacktrackDifference(daysInMonth(backtrack, +1));
                    }}>
                        {">>"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        dispatch({
                            type: "SetArticleCursor",
                            mode,
                            sort,
                            period,
                            backtrack: 0,
                        });
                    }}>
                        {"0"}
                    </AnchorButton>
                </span>
                }
            </nav>
            {props.children}
        </div>
    );
}
