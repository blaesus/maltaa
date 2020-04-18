import * as React from "react";
import { useEffect } from "react";

import "./AssortmentPage.css";

import { ClientState } from "../../states/reducer";

import { ArticleSummary } from "../ArticleSummary/ArticleSummary";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { EditableText } from "../EditableText/EditableText";

import { assortmentNames, hasIntersection, readableDateTime } from "../../../../utils";
import { assortmentUrl, findAssortmentFromState, MaltaaDispatch } from "../../uiUtils";
import { Assortment, AssortmentId, AssortmentItem } from "../../../../definitions/Assortment";
import { UserPublic } from "../../../../definitions/User";
import { AuthorTag } from "../AuthorTag/AuthorTag";

function AssortmentItemCard(props: {
    item: AssortmentItem,
    canEdit: boolean,
    index: number,
    dispatch: MaltaaDispatch,
    assortment: Assortment,
    collector?: UserPublic,
    children: React.ReactNode,
}) {
    const {item, canEdit, collector, dispatch, assortment, index} = props;
    return (
        <div className="AssortmentCard">
            {props.children}
            <EditableText
                content={item.note}
                canEdit={canEdit}
                onEdit={content => {
                    dispatch({
                        type: "UpdateAssortment",
                        operation: "SetItem",
                        target: assortment.id,
                        targetItemId: item.id,
                        item: {
                            ...item,
                            note: content,
                        },
                    });
                }}
            />
            <div>
                {collector?.displayName}於{readableDateTime(item.addedAt)}收錄
            </div>
            {
                canEdit &&
                <div>
                    {
                        index >= 1 &&
                        <AnchorButton
                            onClick={() => {
                                const items = assortment.items.map(item => item.id);
                                const temp = items[index - 1];
                                items[index - 1] = items[index];
                                items[index] = temp;
                                dispatch({
                                    type: "UpdateAssortment",
                                    operation: "OrderItems",
                                    target: assortment.id,
                                    items: items,
                                    meta: {},
                                });
                            }}
                        >
                            上移
                        </AnchorButton>
                    }
                    {
                        index < assortment.items.length - 1 &&
                        <AnchorButton
                            onClick={() => {
                                const items = assortment.items.map(item => item.id);
                                const temp = items[index + 1];
                                items[index + 1] = items[index];
                                items[index] = temp;
                                dispatch({
                                    type: "UpdateAssortment",
                                    operation: "OrderItems",
                                    target: assortment.id,
                                    items: items,
                                    meta: {},
                                });
                            }}
                        >
                            下移
                        </AnchorButton>
                    }
                </div>
            }
        </div>
    )
}

export function AssortmentPage(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    const identifier = state.ui.pages.assortment.identifier;
    const {me, articles, users} = state.entities;
    useEffect(() => {
        if (state.ui.pages.current === "assortment") {
            window.scroll(0, 0);
        }
        if (identifier) {
            dispatch({
                type: "ViewAssortment",
                assortment: identifier,
            });
        }
    }, [identifier]);
    if (state.ui.pages.current !== "assortment" || !identifier) {
        return null;
    }
    const assortment = findAssortmentFromState(state, identifier);
    if (!assortment) {
        return null;
    }
    const url = assortmentUrl(identifier);
    const canEdit = !assortment.archived && hasIntersection(me?.mattersIds, assortment.editors);
    const isOwner = hasIntersection(me?.mattersIds, [assortment.owner]);
    return (
        <div className="AssortmentPage">
            <h1>
                {assortment.title}
                【{assortmentNames[assortment.contentType]}】
            </h1>
            <div>
                <span>總編
                    <AuthorTag author={users[assortment.owner]} />
                </span>
                {
                    assortment.editors.length >= 2 &&
                    <span>
                        編輯
                        {
                            assortment.editors.map(id =>
                                <AuthorTag key={id} author={users[id]} />
                            )
                        }
                    </span>
                }
            </div>
            <div>
                <a href={url}>{url}</a>
                {
                    assortment.archived &&
                    <span>
                        已封存
                    </span>
                }
                {
                    isOwner &&
                    <AnchorButton
                        onClick={() => dispatch({
                            type: "UpdateAssortment",
                            operation: "Archive",
                            target: assortment.id,
                            archived: !assortment.archived
                        })}
                    >
                        {assortment.archived ? "撤銷封存" : "封存集合"}
                    </AnchorButton>
                }
            </div>
            <div>
                {
                    assortment.items.map((item, index) => {
                        switch (item.entityType) {
                            case "article": {
                                const article = articles[item.id];
                                if (!article) {
                                    return `Missing article data ${JSON.stringify(item)}`;
                                }
                                const author = users[article.author];
                                const collector = users[item.addedBy];
                                return (
                                    <AssortmentItemCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        assortment={assortment}
                                        collector={collector}
                                        canEdit={canEdit}
                                        dispatch={dispatch}
                                    >
                                        <ArticleSummary
                                            article={article}
                                            author={author}
                                            hoverPreview={true}
                                            onClick={() => dispatch({type: "ViewArticle", article: article.id})}
                                        />
                                    </AssortmentItemCard>
                                );
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
    );
}