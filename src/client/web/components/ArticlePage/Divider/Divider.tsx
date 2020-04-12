import * as React from "react";
import "./Divider.css";

export function Divider(props: {
    text?: string
    height?: number,
}) {
    return (
        <div className="Divider" style={{height: props.height}}>
            {props.text}
        </div>
    )
}
