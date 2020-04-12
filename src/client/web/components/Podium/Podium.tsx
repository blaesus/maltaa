import * as React from "react";
import { useEffect } from "react";

import "./Podium.css"

import { PodiumPageState } from "../../states/uiReducer";
import { ClientState } from "../../states/reducer";
import { MaltaaAction } from "../../../../definitions/actions";

import { ArticleList } from "../ArticleList/ArticleList";
import { PodiumPeriodChooser, PodiumSortChooser } from "../PreferenceChoosers";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import { DAY, readableDateTime } from "../../../../utils";

function usePrevious<T>(value: T) {
    const ref = React.useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

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

    const currentPage = state.ui.pages.current;
    const prevCurrentPage = usePrevious(currentPage);
    const prevSort = usePrevious(sort);
    const prevStart = usePrevious(period);
    const prevEnd = usePrevious(backtrack);

    function updatePodium() {
        const switchToEmptyPodium =
            prevCurrentPage !== "podium"
            && currentPage === "podium"
            && state.ui.pages.podium.pagination.receivedItems === 0;

        const shouldLoad =
            prevSort !== sort
            || prevStart !== period
            || prevEnd !== backtrack
            || switchToEmptyPodium;

        if (shouldLoad) {
            dispatch({
                type: "LoadPodiumArticles",
                sort: sort,
                periodInDays: period,
                pageNumber: page.pagination.nextPage,
                backtrackInDays: backtrack || undefined,
            });
        }
    }

    useEffect(updatePodium, [sort, period, backtrack, currentPage]);

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
                page={page}
                state={props.state}
                dispatch={dispatch}
            />
        </div>
    )
}
