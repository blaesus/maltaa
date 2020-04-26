import * as React from "react";

const heuristicInitialWidth = 640;

export function useContentWidth(fallbackWidth = heuristicInitialWidth) {
    const contentDom = React.useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = React.useState(fallbackWidth);
    React.useEffect(() => {
        const width = contentDom.current ? contentDom.current.getBoundingClientRect().width : fallbackWidth;
        setContentWidth(width);
    }, [contentDom.current]);

    return {
        contentWidth,
        contentDom,
    }
}