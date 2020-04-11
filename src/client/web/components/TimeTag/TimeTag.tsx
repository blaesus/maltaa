import * as React from "react"
import {readableDateTime} from "../../../../utils";
import "./TimeTag.css";

export function TimeTag(props: {
    time: number,
}) {
    return (
        <time
            className="TimeTag"
            dateTime={new Date(props.time).toISOString()}
        >
            {readableDateTime(props.time)}
        </time>
    )

}