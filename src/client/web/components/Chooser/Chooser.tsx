import * as React from "react";
import "./Chooser.css";

export function Chooser<Value>(props: {
    options: {label: string, value: Value}[],
    chosen: Value,
    onChoose(value: Value): void
}) {
    return (
        <span className="Chooser">
            {
                props.options.map(o =>
                    <a
                        key={o.label}
                        className={`Option ${o.value === props.chosen ? "chosen" : ""}`}
                        role="button"
                        onClick={() => props.onChoose(o.value)}
                    >
                        {o.label}
                    </a>
                )
            }
        </span>
    )

}
