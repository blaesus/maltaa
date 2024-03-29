import * as React from "react";
import { useCallback, useState } from "react";

import "./ArticleSummary.css"

import { UserPublic } from "../../../../definitions/User";
import { Article } from "../../../../definitions/Article";

import { TimeTag } from "../TimeTag/TimeTag";
import { UserLabel } from "../AuthorLabel/UserLabel";
import { ArticlePreview } from "./ArticlePreview/ArticlePreview";

import { articleUrl, getAnchorClickHandler } from "../../uiUtils";

export function ArticleSummary(props: {
    article: Article,
    author: UserPublic,
    hoverPreview?: boolean,
    onClick?(): void
}) {
    const [extend, setExtend] = useState(false);
    const {article, author, hoverPreview} = props;
    const url = articleUrl(article.id);
    const onMouseEnter = useCallback(() => setExtend(true), []);
    const onMouseLeave = useCallback(() => setExtend(false), []);
    return (
        <a
            className="ArticleSummary"
            href={url}
            onClick={getAnchorClickHandler(props.onClick)}
            id={article.id}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <h2 className="Title">
                {article.title}
                <span className="AuthorLine">
                    {"/"}
                    <UserLabel user={author} surpressAnchor={true}/>
                </span>
            </h2>
            <span className="Meta">
                <TimeTag time={article.createdAt}/>
                <span className="comments">
                    {article.derived.comments}評
                </span>
                <span className="appreciations">
                    {article.derived.appreciationAmount}讚
                </span>
            </span>
            {
                hoverPreview && extend &&
                <ArticlePreview article={article}/>
            }
        </a>
    )
}
