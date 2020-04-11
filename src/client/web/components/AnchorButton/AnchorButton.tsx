import * as React from "react";
import "./AnchorButton.css";

export function AnchorButton(props: {
    children: React.ReactNode,
    className?: string,
    onClick(): void
}) {
    return (
        <a
            className={`AnchorButton ${props.className || ""}`}
            onClick={props.onClick}
            role="button"
        >
            {props.children}
        </a>
    )

}
