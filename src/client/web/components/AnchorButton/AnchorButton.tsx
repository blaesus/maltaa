import * as React from "react";
import "./AnchorButton.css";
import { MouseEventHandler } from "react";

export function AnchorButton(props: {
    children?: React.ReactNode,
    className?: string,
    href?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
    disabled?: boolean,
}) {
    return (
        <a
            className={`AnchorButton ${props.className || ""} ${props.disabled ? "disabled" : "none"}`}
            onClick={props.onClick}
            role="button"
            href={props.href}
        >
            {props.children}
        </a>
    )

}
