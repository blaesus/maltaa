import * as React from "react";
import { useEffect, useState } from "react";

import "./AssortmentPage.css";

import { ClientState } from "../../states/reducer";

import { ArticleSummary } from "../ArticleSummary/ArticleSummary";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { EditableText } from "../EditableText/EditableText";

import { assortmentNames, hasIntersection, readableDateTime } from "../../../../utils";
import {
    AssortmentUIIdentifier,
    assortmentPath,
    findAssortmentFromState,
    MaltaaDispatch,
    assortmentPathPrefix,
} from "../../uiUtils";
import { Assortment, AssortmentId, AssortmentIdentifier, AssortmentItem } from "../../../../definitions/Assortment";
import { UserPublic } from "../../../../definitions/User";
import { AuthorLabel } from "../AuthorLabel/AuthorLabel";
import { isDefinitionNode } from "graphql";
import { SubpathEditor } from "../AssortmentEditor/SubpathEditor";

function AssortmentItemCard(props: {
    item: AssortmentItem,
    canEdit: boolean,
    index: number,
    dispatch: MaltaaDispatch,
    assortment: Assortment,
    collector?: UserPublic,
    lastReviewer?: UserPublic,
    children: React.ReactNode,
}) {
    const {item, canEdit, collector, dispatch, assortment, index, lastReviewer} = props;
    return (
        <div className="AssortmentCard">
            {props.children}
            <EditableText
                content={item.review}
                canEdit={canEdit}
                onEdit={content => {
                    dispatch({
                        type: "UpdateAssortment",
                        operation: "EditReview",
                        target: assortment.id,
                        targetItemId: item.id,
                        review: content,
                    });
                }}
            />
            <div className="CollectionByline">
                {collector?.displayName}於{readableDateTime(item.collectionTime)}收錄
                {
                    item.collectionTime !== item.lastReviewTime &&
                    <span>
                        。評語由{lastReviewer?.displayName}於{readableDateTime(item.lastReviewTime)}撰寫。
                    </span>
                }
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

export function Subpath(props: {
    identifier: AssortmentUIIdentifier,
    canEdit: boolean,
}) {
    const {identifier, canEdit} = props;
    const url = assortmentPath(identifier);
    const [editing, setEditing] = useState(false);

    const [subpath, setSubpath] = useState(identifier.subpath);

    return (
        <div>
            {
                !editing &&
                <a href={url}>{url}</a>
            }
            {
                canEdit && !editing &&
                    <AnchorButton onClick={() => setEditing(true)}>變更路徑</AnchorButton>
            }
            {
                editing &&
                <SubpathEditor
                    pathPrefix={assortmentPathPrefix(identifier)}
                    subpath={subpath}
                    onChange={setSubpath}
                />
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
    const canEdit = !assortment.archived && hasIntersection(me?.mattersIds, assortment.editors);
    const isOwner = hasIntersection(me?.mattersIds, [assortment.owner]);
    return (
        <div className="AssortmentPage">
            <h1>
                <EditableText
                    content={assortment.title}
                    canEdit={canEdit}
                    onEdit={content => {
                        dispatch({
                            type: "UpdateAssortment",
                            operation: "EditTitle",
                            target: assortment.id,
                            title: content,
                        });
                    }}
                />
            </h1>
            <div>
                <span>
                    {assortmentNames[assortment.contentType]}總編
                    <AuthorLabel author={users[assortment.owner]} />
                </span>
                {
                    assortment.editors.length >= 2 &&
                    <span>
                        編輯
                        {
                            assortment.editors.map(id =>
                                <AuthorLabel key={id} author={users[id]} />
                            )
                        }
                    </span>
                }
            </div>
            <div>
                <Subpath
                    identifier={identifier}
                    canEdit={canEdit}
                />
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
                                return (
                                    <AssortmentItemCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        assortment={assortment}
                                        collector={users[item.collector]}
                                        lastReviewer={users[item.lastReviewer]}
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