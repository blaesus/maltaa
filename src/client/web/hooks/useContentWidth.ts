import * as React from "react";

export function useContentWidth(fallbackWidth?: number) {
    const contentDom = React.useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = React.useState(fallbackWidth || 0);
    React.useEffect(() => {
        const width = contentDom.current ? contentDom.current.getBoundingClientRect().width : 0;
        setContentWidth(width);
    }, [contentDom.current]);

    return {
        contentWidth,
        contentDom,
    }
}