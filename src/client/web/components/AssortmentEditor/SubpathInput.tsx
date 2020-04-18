import * as React from "react";

export function SubpathInput(props: {
    pathPrefix: string,
    subpath: string,
    onChange(value: string): void,
}) {
    const {pathPrefix, subpath} = props;
    return (
        <span className="SubpathEditor">
            {pathPrefix}
            <input
                value={subpath}
                onChange={event => props.onChange(event.target.value)}
                placeholder={"路徑"}
            />
        </span>
    )
}