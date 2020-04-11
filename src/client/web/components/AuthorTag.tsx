import * as React from "react";
import { UserId, UserPublic } from "../../../data-types";
import "./AuthorTag.css"
import { USER_URL_SIGIL } from "../../../settings";
import { getAnchorClickHandler } from "../uiUtils";

export function AuthorTag(props: {
    author?: UserPublic | null,
    surpressAnchor?: boolean
    onClick?(): any,
}) {
    const {author} = props;
    if (!author) {
        return null;
    }
    const content = <span>{author.displayName}</span>;
    if (props.surpressAnchor) {
        return (
            <span className="AuthorTag" onClick={getAnchorClickHandler(props.onClick)}>{content}</span>
        )
    }
    else {
        return (
            <a
                className="AuthorTag"
                href={`/${USER_URL_SIGIL}${author.userName}`}
                onClick={getAnchorClickHandler(props.onClick)}
            >
                <bdi>{content}</bdi>
            </a>
        )
    }
}
