import * as React from "react";
import { articleUrl, findAssortmentFromState, MaltaaDispatch } from "../../uiUtils";
import { ClientState } from "../../states/reducer";
import { assortmentNames, readableDateTime } from "../../../../utils";
import { ArticleSummary } from "../ArticleSummary/ArticleSummary";
import { useEffect } from "react";

export function AssortmentPage(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    const identifier = state.ui.pages.assortment.identifier;
    useEffect(() => {
        if (state.ui.pages.current === "assortment") {
            window.scroll(0, 0);
        }
        if (identifier) {
            dispatch({
                type: "ViewAssortment",
                assortment: identifier,
            })
        }
    }, [identifier]);
    if (state.ui.pages.current !== "assortment" || !identifier) {
        return null;
    }
    const assortment = findAssortmentFromState(state, identifier);
    if (!assortment) {
        return null;
    }
    return (
        <div className="AssortmentPage">
            <h1>{assortment.title}</h1>
            <div>{assortmentNames[assortment.contentType]}</div>
            <div>
                {
                    assortment.items.map(item => {
                        switch (item.entityType) {
                            case "article": {
                                const article = state.entities.articles[item.id];
                                if (!article) {
                                    return `Missing article data ${JSON.stringify(item)}`
                                }
                                const author = state.entities.users[article.author];
                                const collector = state.entities.users[item.addedBy];
                                return (
                                    <div
                                        key={item.id}
                                    >
                                        <ArticleSummary
                                            article={article}
                                            author={author}
                                            hoverPreview={true}
                                        />
                                        <div>
                                            {item.note}
                                        </div>
                                        <div>
                                            {collector?.displayName}於{readableDateTime(item.addedAt)}收錄
                                        </div>
                                    </div>
                                )
                            }
                            default: {
                                return (
                                    <div key={item.id}>
                                        未實現：{item.id}
                                    </div>
                                );
                            }
                        }
                    })
                }
            </div>

        </div>
    )
}