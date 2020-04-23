import * as React from "react";

import "./ArticleListCursorControl.css";
import { ArticlePeriodChooser, ArticleSortChooser } from "../PreferenceChoosers";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import { DAY, readableDateTime } from "../../../../utils";
import { ArticleSort } from "../../../../sorts";

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
    sort: ArticleSort,
    period: number,
    backtrack: number,
    onChooseSort(sort: ArticleSort): void,
    onChoosePeriod(period: number): void,
    onSetBacktrackDifference?(delta: number): void,
    onResetBacktrack?(): void
    children?: React.ReactNode,
}) {
    const {sort, period, backtrack} = props;
    return (
        <div className="ArticleListCursorControl">
            <nav className="CursorSettings">
                <ArticleSortChooser
                    chosen={sort}
                    onChange={props.onChooseSort}
                />
                <ArticlePeriodChooser
                    chosen={period}
                    onChange={props.onChoosePeriod}
                />
                <span className="TimeMachineDate">
                    <AnchorButton onClick={() => {
                        props.onSetBacktrackDifference && props.onSetBacktrackDifference(daysInMonth(backtrack, -1));
                    }}>
                        {"<<"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        props.onSetBacktrackDifference && props.onSetBacktrackDifference(-1);
                    }}>
                        {"<"}
                    </AnchorButton>
                    <BacktrackDisplay backtrack={backtrack}/>
                    <AnchorButton onClick={() => {
                        props.onSetBacktrackDifference && props.onSetBacktrackDifference(1);
                    }}>
                        {">"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        props.onSetBacktrackDifference && props.onSetBacktrackDifference(daysInMonth(backtrack, +1));
                    }}>
                        {">>"}
                    </AnchorButton>
                    <AnchorButton onClick={() => {
                        props.onResetBacktrack && props.onResetBacktrack();
                    }}>
                        {"0"}
                    </AnchorButton>

                </span>
            </nav>
            {props.children}
        </div>
    );
}
