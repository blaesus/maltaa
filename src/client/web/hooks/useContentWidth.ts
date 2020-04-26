import * as React from "react";

export function useContentWidth(fallbackWidth = 0) {
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = React.useState(fallbackWidth);
    React.useEffect(() => {
        const width = contentRef.current ? contentRef.current.getBoundingClientRect().width : fallbackWidth;
        setContentWidth(width);
    }, [contentRef.current]);

    return {
        contentWidth,
        contentRef,
    }
}