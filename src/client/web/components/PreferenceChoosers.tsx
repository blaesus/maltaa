import * as React from "react";
import { Chooser, OptionList } from "./Chooser/Chooser";
import { ArticleSort } from "../../../sorts";

const DECADE = 10 * 365;

const sortOptions: OptionList<ArticleSort> = [
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
        value: DECADE,
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
            options={sortOptions}
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


