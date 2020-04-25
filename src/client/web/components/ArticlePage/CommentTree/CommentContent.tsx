import * as React from "react";

import "./CommentContent.css";

import { Comment } from "../../../../../definitions/Article";

import { HtmlRender } from "../../HtmlRender/HtmlRender";
import { Byline } from "../../Byline/Byline";

import { heuristicallyShouldIndent } from "./shouldIndent";
import { UserPublic } from "../../../../../definitions/User";

export function CommentContent(props: {
    comment: Comment,
    author: UserPublic,
    treeWidth: number,
    domRef?: React.RefObject<HTMLDivElement>,
    onAuthorClick(): void
}) {
    const {comment, author, treeWidth, domRef, onAuthorClick} = props;
    return (
        <div
            className="Content"
            data-prefer-indent={heuristicallyShouldIndent(comment.content, treeWidth) || undefined}
            ref={domRef}
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