import * as React from "react";
import { Article, UserPublic } from "../../../data-types";
import "./ArticleSummary.css"
import {TimeTag} from "./TimeTag/TimeTag";
import { AuthorTag } from "./AuthorTag";
import { getAnchorClickHandler, serializeToPathName } from "../uiUtils";
import { ArticlePreview } from "./ArticlePreview";
import { useCallback, useState } from "react";

export function ArticleSummary(props: {
    article: Article,
    author: UserPublic,
    hoverPreview: boolean,
    onClick?(): void
}) {
    const [extend, setExtend] = useState(false);
    const {article, author, hoverPreview} = props;
    const url = serializeToPathName({
        pages: {
            current: "article",
            article: {
                id: article.id
            }
        }}
    );
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
                    <AuthorTag author={author} surpressAnchor={true} />
                </span>
            </h2>
            <span className="Meta">
                <TimeTag time={article.createdAt} />
                <span className="comments">
                    {article.derived.comments}評
                </span>
                <span className="appreciations">
                    {article.derived.appreciationAmount}讚
                </span>
            </span>

            {
                hoverPreview && extend &&
                <ArticlePreview article={article} />
            }
        </a>
    )
}
