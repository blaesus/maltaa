import * as React from "react";
import "./HtmlRender.css";

export function HtmlRender(props: {
    html: string,
    hideInserts?: boolean
}) {
    let {html} = props;
    if (props.hideInserts) {
        html = html.replace(/\n/g, "") // Audio <figure> has newlines in them that blocks regex
                   .replace(/<figure.*?<\/figure>/g, "")
    }
    return (
        <div
            className={`HtmlRender`}
            dangerouslySetInnerHTML={{__html: html}}
        />
    )
}
