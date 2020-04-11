import * as React from "react";
import { useRef, useState } from "react";

import { HtmlRender } from "./HtmlRender/HtmlRender";
import { Article } from "../../../data-types";

import "./ArticlePreview.css";

export function ArticlePreview(props: {
    article: Article,
    extendUpwards?: boolean,
}) {
    const self = useRef<HTMLDivElement>(null);
    const [upwards, setUpwards] = useState(false);
    React.useLayoutEffect(() => {
        if (self.current) {
            const domRect = self.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - domRect.bottom;
            if (spaceBelow < 0) {
                setUpwards(true);
            }
        }
    })
    return (
        <div className={`ArticlePreview ${upwards ? "upwards" : ""}`}>
            <div className="Content" ref={self}>
                <HtmlRender html={props.article.content} hideInserts={true} />
            </div>
        </div>
    )
}
