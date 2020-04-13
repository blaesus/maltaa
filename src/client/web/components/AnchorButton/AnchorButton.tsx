import * as React from "react";
import "./AnchorButton.css";
import { MouseEventHandler } from "react";

export function AnchorButton(props: {
    children?: React.ReactNode,
    className?: string,
    href?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
}) {
    return (
        <a
            className={`AnchorButton ${props.className || ""}`}
            onClick={props.onClick}
            role="button"
            href={props.href}
        >
            {props.children}
        </a>
    )

}
