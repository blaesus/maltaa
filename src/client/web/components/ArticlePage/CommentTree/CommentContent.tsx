import * as React from "react";

import "./CommentContent.css";

import { Comment } from "../../../../../definitions/Article";
import { UserPublic } from "../../../../../definitions/User";

import { HtmlRender } from "../../HtmlRender/HtmlRender";
import { Byline } from "../../Byline/Byline";

import { heuristicallyShouldIndent } from "./shouldIndent";
import { useContentWidth } from "../../../hooks/useContentWidth";

export function CommentContent(props: {
    comment: Comment,
    author: UserPublic,
    fallbackWidth?: number,
    onAuthorClick(): void
}) {
    const {comment, author, fallbackWidth, onAuthorClick} = props;
    const {contentWidth, contentDom} = useContentWidth(fallbackWidth);
    return (
        <div
            className="CommentContent"
            data-prefer-indent={heuristicallyShouldIndent(comment.content, contentWidth) || undefined}
            ref={contentDom}
        >
            <HtmlRender html={comment.content}/>
            <Byline
                author={author}
                publishTime={comment.createdAt}
                onAuthorClick={onAuthorClick}
            />
        </div>
    );
}