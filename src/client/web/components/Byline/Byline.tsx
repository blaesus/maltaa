import * as React from "react"
import {AuthorTag} from "../AuthorTag/AuthorTag";
import {UserPublic} from "../../../../definitions/data-types";
import {TimeTag} from "../TimeTag/TimeTag";

import "./Byline.css";

export function Byline(props: {
    author: UserPublic,
    publishTime: number,
    href?: string,
    onAuthorClick?(): any,
}) {
    return (
        <span className="Byline">
            <AuthorTag author={props.author} onClick={props.onAuthorClick}/>
            {" "}
            <TimeTag time={props.publishTime} />
        </span>
    )
}
