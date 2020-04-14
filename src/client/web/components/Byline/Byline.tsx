import * as React from "react";
import "./Byline.css";

import { UserPublic } from "../../../../definitions/User";
import { AuthorTag } from "../AuthorTag/AuthorTag";
import { TimeTag } from "../TimeTag/TimeTag";


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
            <TimeTag time={props.publishTime}/>
        </span>
    );
}
