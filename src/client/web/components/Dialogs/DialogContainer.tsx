import * as React from "react";
import "./DialogContainer.css";

export function DialogContainer(props: {
    children: React.ReactNode,
    onHide?(): void
}) {
    return (
        <div
            className="DialogContainer"
            onClick={event => {
                if (event.target === event.currentTarget) {
                    props.onHide && props.onHide()
                }
            }}
        >
            <div className="DialogContent">
                {props.children}
            </div>
        </div>
    )
}
