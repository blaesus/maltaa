import * as React from "react";

export function useContentWidth(fallbackWidth = 0) {
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