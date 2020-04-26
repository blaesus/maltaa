import * as React from "react";

export function useWidth(fallbackWidth?: number) {
    const contentDom = React.useRef<HTMLDivElement>(null);
    const [myContentWidth, setMyContentWidth] = React.useState(fallbackWidth || 0);
    React.useEffect(() => {
        const width = contentDom.current ? contentDom.current.getBoundingClientRect().width : 0;
        setMyContentWidth(width);
    }, [contentDom.current]);

    return {
        contentWidth: myContentWidth,
        contentDom,
    }
}