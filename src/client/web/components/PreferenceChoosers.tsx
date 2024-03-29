import * as React from "react";
import { Chooser, OptionList } from "./Chooser/Chooser";
import { ArticleSort, CommentSort } from "../../../sorts";
import { INFINITY_JSON } from "../../../utils";

const articleSortOptions: OptionList<ArticleSort> = [
    {
        value: "comments",
        label: "評論量",
    },
    {
        value: "appreciationAmount",
        label: "讚量",
    },
    {
        value: "recent",
        label: "最新",
    },
    {
        value: "old",
        label: "最早",
    },
    {
        value: "random",
        label: "隨緣",
    },
];

const periodOptions: OptionList<number> = [
    {
        value: 1,
        label: "24小时",
    },
    {
        value: 3,
        label: "3日",
    },
    {
        value: 30,
        label: "30日",
    },
    {
        value: 365,
        label: "1年",
    },
    {
        value: INFINITY_JSON,
        label: "所有",
    },
];

export function ArticleSortChooser(props: {
    chosen: ArticleSort,
    onChange(value: ArticleSort): void
}) {
    const { chosen } = props;
    return (
        <Chooser
            options={articleSortOptions}
            chosen={props.chosen}
            onChoose={(newSort: ArticleSort) => {
                if (newSort !== chosen) {
                    props.onChange(newSort);
                }
            }}
        />
    )
}

export function ArticlePeriodChooser(props: {
    chosen: number,
    onChange(newStart: number): void
}) {
    const {chosen} = props;
    return (
        <Chooser
            options={periodOptions}
            chosen={chosen}
            onChoose={(newPeriod: number) => {
                if (newPeriod !== chosen) {
                    props.onChange(newPeriod)
                }
            }}
        />
    )
}

const commentSortOptions: OptionList<CommentSort> = [
    {
        value: "recent",
        label: "最新",
    },
    {
        value: "old",
        label: "最早",
    },
];


export function CommentSortChooser(props: {
    chosen: CommentSort,
    onChange(value: CommentSort): void
}) {
    const { chosen } = props;
    return (
        <Chooser
            options={commentSortOptions}
            chosen={props.chosen}
            onChoose={(newSort: CommentSort) => {
                if (newSort !== chosen) {
                    props.onChange(newSort);
                }
            }}
        />
    )
}
