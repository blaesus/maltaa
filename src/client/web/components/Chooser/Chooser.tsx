import * as React from "react";
import "./Chooser.css";
import {OptionList} from "../../uiUtils";

export function Chooser<Value>(props: {
    options: OptionList<Value>,
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
