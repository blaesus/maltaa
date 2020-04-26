import * as React from "react";
import { PaginationStatus } from "../../states/uiReducer";

import "./ListButton.css"

export function ListButton(props: {
    pagination: PaginationStatus,
    onClick(): void
}) {
    const {pagination} = props;
    return (
        <a
            className="ListButton"
            onClick={props.onClick}>
            {
                pagination.exhausted ?
                    "没了" :
                    pagination.loading
                        ? "正加載，請稍候……"
                        : "再來幾篇"
            }
        </a>
        )
}