import * as React from "react";
import { useState } from "react";

import "./StreamList.css";

import { Article, ObjectMap, UserId, UserPublic } from "../../../../../definitions/data-types";
import { ArticleSort, articleSorts } from "../../../../../sorts";
import { MaltaaAction } from "../../../../../definitions/actions";
import { ArticleSummary } from "../../ArticleSummary/ArticleSummary";
import { AnchorButton } from "../../AnchorButton/AnchorButton";

export function StreamList(props: {
    label: string,
    emptyLabel: string,
    foldLimit?: number,
    streams: Article[],
    users: ObjectMap<UserPublic>,
    sort: ArticleSort,
    screenedUsers: UserId[],
    hoverPreview: boolean,
    dispatch(action: MaltaaAction): void
}) {
    const {label, emptyLabel, streams, screenedUsers, foldLimit, sort, dispatch, users} = props;
    const enableFolding = streams.length > (foldLimit || Infinity);
    const [fold, setFold] = useState(enableFolding);
    if (!streams.length) {
        return (
            <aside className="StreamList">
                <h6 className="StreamLabel">
                    {emptyLabel}
                </h6>
            </aside>
        );
    }
    return (
        <aside className="StreamList">
            <h6 className="StreamLabel">
                {streams.length}篇{label}
                {
                    enableFolding &&
                    <AnchorButton
                        onClick={() => setFold(fold => !fold)}
                    >
                        {fold ? `展開` : `摺疊`}
                    </AnchorButton>
                }
            </h6>
            {
                !fold && streams
                    .filter(a => !screenedUsers.includes(a.author))
                    .sort(articleSorts[sort])
                    .map(article => (
                        <ArticleSummary
                            key={article.id}
                            article={article}
                            author={users[article.author]}
                            hoverPreview={props.hoverPreview}
                            onClick={() => dispatch({type: "ViewArticle", article: article.id})}
                        />
                    ))
            }
        </aside>
    )
}
