import * as React from "react";
import {ArticleSummary} from "../ArticleSummary/ArticleSummary";
import "./ArticleList.css";
import { MaltaaAction } from "../../../../definitions/Actions";
import { daysAgoInEpoch } from "../../../../utils";
import { articleSorts } from "../../../../sorts";
import {ClientState} from "../../states/reducer";
import {PodiumPageState} from "../../states/uiReducer";

export function ArticleList(props: {
    state: ClientState,
    page: PodiumPageState,
    dispatch(action: MaltaaAction): void;
}) {
    const {page, dispatch, state} = props;
    const {articles, users} = props.state.entities;
    const blockedUsers = props.state.preferences.data.screenedUsers;
    const {sort, period, backtrack} = state.ui.pages.podium;
    return (
        <div className="ArticleList">
            {
                Object.values(articles)
                      .filter(a =>
                          a.createdAt >= daysAgoInEpoch(period + backtrack)
                          && a.createdAt <= daysAgoInEpoch(backtrack)
                          && !blockedUsers.includes(a.author)
                      )
                      .sort(articleSorts[sort])
                      .slice(0, page.pagination.receivedItems)
                      .map(
                          article => (
                              <ArticleSummary
                                  key={article.id}
                                  article={article}
                                  author={users[article.author]}
                                  hoverPreview={state.preferences.podium.hoverPreview}
                                  onClick={() => dispatch({type: "ViewArticle", article: article.id})}
                              />
                          )
                      )
            }
            <a
                className="More"
                onClick={() => dispatch({
                    type: "LoadPodiumArticles",
                    sort,
                    periodInDays: period,
                    backtrackInDays: backtrack || undefined,
                    pageNumber: page.pagination.nextPage,
                })}
            >
                {
                    page.pagination.exhausted ? "没了" :
                    page.pagination.loading ? "正加載，請稍候……" : "再來幾篇"
                }
            </a>
        </div>
    )
}
