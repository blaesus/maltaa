import * as React from "react";
import { useEffect } from "react";
import "./ArticleList.css";

import { MaltaaAction } from "../../../../definitions/Actions";
import { ClientState } from "../../states/reducer";
import { ArticleListSetting, PageName } from "../../states/uiReducer";

import { ArticleSummary } from "../ArticleSummary/ArticleSummary";

import { daysAgoInEpoch, dedupeById } from "../../../../utils";
import { ArticleSort, articleSorts } from "../../../../sorts";
import { MaltaaDispatch } from "../../uiUtils";
import { UserId } from "../../../../definitions/User";

function usePrevious<T>(value: T) {
    const ref = React.useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

function useLoadArticleList(
    currentPage: PageName,
    listState: ArticleListSetting,
    author: UserId | null,
    dispatch: MaltaaDispatch
) {
    const {sort, period, backtrack} = listState;
    const prevCurrentPage = usePrevious(currentPage);
    const prevSort = usePrevious(sort);
    const prevStart = usePrevious(period);
    const prevEnd = usePrevious(backtrack);

    function updatePodium() {
        const switchToPodium = prevCurrentPage !== "podium" && currentPage === "podium"

        const shouldLoad =
            prevSort !== sort
            || prevStart !== period
            || prevEnd !== backtrack
            || switchToPodium;

        if (shouldLoad) {
            dispatch({
                type: "LoadArticles",
                sort: sort,
                periodInDays: period,
                pageNumber: listState.pagination.nextPage,
                backtrackInDays: backtrack || undefined,
                author,
            });
        }
    }

    useEffect(updatePodium, [sort, period, backtrack, currentPage]);
}

export function ArticleList(props: {
    mode: "podium" | "user"
    state: ClientState,
    dispatch(action: MaltaaAction): void;
}) {
    const {mode, dispatch, state} = props;
    let page: ArticleListSetting;
    let authorId: UserId | null;
    switch (mode) {
        case "podium": {
            page = state.ui.pages.podium;
            authorId = null;
            break;
        }
        case "user": {
            page = state.ui.pages.user.articles;
            const targetAuthor = Object.values(state.entities.users).find(u => u.userName === state.ui.pages.user.name);
            authorId = targetAuthor?.id || null;
            break;
        }
    }

    const {articles, users} = props.state.entities;
    const blockedUsers = props.state.preferences.data.screenedUsers;
    const {sort, period, backtrack} = page;

    useLoadArticleList(state.ui.pages.current, page, authorId, dispatch);

    let articlesForDisplay = Object.values(articles)
                                   .filter(a =>
                                       a.createdAt >= daysAgoInEpoch(period + backtrack)
                                       && a.createdAt <= daysAgoInEpoch(backtrack)
                                       && !blockedUsers.includes(a.author),
                                   );

    if (mode === "user" && state.ui.pages.user.name) {
        articlesForDisplay = articlesForDisplay.filter(a => a.author === authorId);
    }

    if (sort === "random") {
        articlesForDisplay = articlesForDisplay.filter(a => page.pagination.receivedItems.includes(a.id));
    }
    else {
        articlesForDisplay = articlesForDisplay.sort(articleSorts[sort])
                                               .filter(a =>
                                                   a.createdAt >= daysAgoInEpoch(period + backtrack)
                                                   && a.createdAt <= daysAgoInEpoch(backtrack)
                                                   && !blockedUsers.includes(a.author),
                                               )
                                               .slice(0, page.pagination.receivedItems.length);
    }

    articlesForDisplay = dedupeById(articlesForDisplay);

    return (
        <div className="ArticleList">
            {
                articlesForDisplay.map(
                    article => (
                        <ArticleSummary
                            key={article.id}
                            article={article}
                            author={users[article.author]}
                            hoverPreview={state.preferences.podium.hoverPreview}
                            onClick={() => dispatch({type: "ViewArticle", article: article.id})}
                        />
                    ),
                )
            }
            <a
                className="More"
                onClick={() => dispatch({
                    type: "LoadArticles",
                    sort,
                    periodInDays: period,
                    backtrackInDays: backtrack || undefined,
                    pageNumber: page.pagination.nextPage,
                    author: authorId,
                })}
            >
                {
                    page.pagination.exhausted ?
                        "没了" :
                        page.pagination.loading
                            ? "正加載，請稍候……"
                            : "再來幾篇"
                }
            </a>
        </div>
    );
}
