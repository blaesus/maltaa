import * as React from "react";
import "./AnchorButton.css";

export function AnchorButton(props: {
    className?: string,
    children: React.ReactNode,
    onClick(): void
}) {
    return (
        <a
            className={`AnchorButton ${props.className || ""}`}
            onClick={props.onClick}
            tabIndex={0}
            role="button"
        >
            {props.children}
        </a>
    )

}
