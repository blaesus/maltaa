import * as React from "react";
import { useEffect, useState } from "react";

import "./AssortmentPage.css";

import { ClientState } from "../../states/reducer";
import { Assortment, AssortmentId, AssortmentItem } from "../../../../definitions/Assortment";
import { UserPublic } from "../../../../definitions/User";

import { ArticleSummary } from "../ArticleSummary/ArticleSummary";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { EditableText } from "../EditableText/EditableText";
import { UserLabel } from "../AuthorLabel/UserLabel";
import { SubpathInput } from "../AssortmentEditor/SubpathInput";

import { assortmentNames, hasIntersection, readableDateTime } from "../../../../utils";
import {
    assortmentPath,
    assortmentPathPrefix,
    findAssortmentFromState,
    MaltaaDispatch,
} from "../../uiUtils";
import { AssortmentCreator } from "../AssortmentEditor/AssortmentCreator";
import { AssortmentSummary } from "../AssortmentSummary/AssortmentSummary";
import { AssortmentSummaryConnected } from "../AssortmentSummary/AssortmentSummaryConnected";
import { EntitiesState } from "../../states/entitiesReducer";
import { AssortmentUIIdentifier } from "../../../../definitions/UI";

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
                editButtonText="修改評語"
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
                    <AnchorButton
                        onClick={() => {
                            dispatch({
                                type: "UpdateAssortment",
                                operation: "DropItem",
                                target: assortment.id,
                                itemId: item.id,
                                meta: {},
                            });
                        }}
                    >
                        刪除
                    </AnchorButton>
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
    );
}

export function SubpathSection(props: {
    assortmentId: AssortmentId,
    identifier: AssortmentUIIdentifier,
    canEdit: boolean,
    dispatch: MaltaaDispatch,
}) {
    const {assortmentId, identifier, canEdit, dispatch} = props;
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
                <span>
                    <SubpathInput
                        pathPrefix={assortmentPathPrefix(identifier)}
                        subpath={subpath}
                        onChange={setSubpath}
                    />
                    <AnchorButton
                        onClick={() => {
                            setEditing(false);
                            dispatch({
                                type: "UpdateAssortment",
                                operation: "EditSubpath",
                                target: assortmentId,
                                subpath,
                            });
                        }}
                    >
                        確定
                    </AnchorButton>
                    <AnchorButton
                        onClick={() => setEditing(false)}
                    >
                        取消
                    </AnchorButton>
                </span>
            }
        </div>
    );
}

export function ForkEditor(props: {
    baseAssortment: Assortment,
    isOwner: boolean,
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch, baseAssortment, isOwner} = props;
    const [forking, setForking] = useState(false);
    return (
        <div>
            {
                baseAssortment.policy.allowForking &&
                <AnchorButton
                    onClick={() => {
                        setForking(true);
                    }}
                >
                    分叉
                </AnchorButton>
            }
            {
                isOwner &&
                <div>
                    <AnchorButton
                        onClick={() => dispatch({
                            type: "UpdateAssortment",
                            operation: "SetPolicy",
                            target: baseAssortment.id,
                            policy: {
                                ...baseAssortment.policy,
                                allowForking: !baseAssortment.policy.allowForking,
                            }
                        })}
                    >
                        {baseAssortment.policy.allowForking ? "禁止分叉" : "允許分叉"}
                    </AnchorButton>
                </div>
            }

            {
                forking &&
                <AssortmentCreator
                    state={state}
                    dispatch={dispatch}
                    fixedContentType={baseAssortment.contentType}
                    upstreams={[baseAssortment.id]}
                />
            }
        </div>
    );
}

export function UpstreamsSection(props: {
    assortment: Assortment,
    canEdit: boolean,
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {assortment, state, dispatch} = props;
    const [editing, setEditing] = useState(false);
    if (!assortment.upstreams.length) {
        return null;
    }
    return (
        <section>
            <div>
                上游
                <AnchorButton onClick={() => setEditing(editing => !editing)}>調整</AnchorButton>
            </div>
            {
                editing &&
                <div>
                    {
                        assortment.upstreams.map(id =>
                            <div key={id}>
                                <AssortmentSummaryConnected id={id} state={state}/>
                                <AnchorButton onClick={() => {
                                    dispatch({
                                        type: "UpdateAssortment",
                                        operation: "SyncFromUpstreams",
                                        target: assortment.id,
                                    });
                                }}>
                                    合併上游內容
                                </AnchorButton>

                                <AnchorButton onClick={() => {
                                    dispatch({
                                        type: "UpdateAssortment",
                                        operation: "EditUpstreams",
                                        target: assortment.id,
                                        upstreams: assortment.upstreams.filter(upstream => upstream !== id),
                                    });
                                }}>
                                    刪除
                                </AnchorButton>
                            </div>,
                        )
                    }
                </div>
            }
            {!editing && assortment.upstreams.map(id => {
                const upstream = state.entities.assortments[id];
                if (upstream) {
                    const owner = state.entities.users[upstream.owner];
                    return (
                        <AssortmentSummary
                            key={id}
                            assortment={upstream}
                            owner={owner}
                        />
                    );
                }
                else {
                    return id;
                }
            })}

        </section>
    );
}

function AssortmentItemSummary(props: {
    item: AssortmentItem,
    entities: EntitiesState;
}) {
    const {item, entities} = props;
    const {articles, users} = entities;
    switch (item.entityType) {
        case "article": {
            const article = articles[item.id];
            if (!article) {
                return <span>Missing article data ${JSON.stringify(item)}</span>;
            }
            const author = users[article.author];
            return (
                <ArticleSummary
                    article={article}
                    author={author}
                    hoverPreview={true}
                />
            );
        }
        case "user": {
            const user = users[item.id];
            if (!user) {
                return <span>Missing user data ${JSON.stringify(item)}</span>;
            }
            return (
                <div>
                    <UserLabel user={user} />
                </div>
            );
        }
        default: {
            return (
                <div>
                    未實現：{item.id}
                </div>
            );
        }
    }
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
    const canEdit = !assortment.policy.archived && hasIntersection(me?.mattersIds, assortment.editors);
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
            <UpstreamsSection
                assortment={assortment}
                canEdit={canEdit}
                state={state}
                dispatch={dispatch}
            />
            {
                me &&
                <ForkEditor
                    baseAssortment={assortment}
                    isOwner={isOwner}
                    state={state}
                    dispatch={dispatch}
                />
            }
            <section>
                <span>
                    {assortmentNames[assortment.contentType]}總編
                    <UserLabel user={users[assortment.owner]}/>
                </span>
                {
                    assortment.editors.length >= 2 &&
                    <span>
                        編輯
                        {
                            assortment.editors.map(id =>
                                <UserLabel key={id} user={users[id]}/>,
                            )
                        }
                    </span>
                }
            </section>
            <section>
                <SubpathSection
                    assortmentId={assortment.id}
                    identifier={identifier}
                    canEdit={canEdit}
                    dispatch={dispatch}
                />
                {
                    assortment.policy.archived &&
                    <span>
                        已封存
                    </span>
                }
                {
                    isOwner &&
                    <AnchorButton
                        onClick={() => dispatch({
                            type: "UpdateAssortment",
                            operation: "SetPolicy",
                            target: assortment.id,
                            policy: {
                                ...assortment.policy,
                                archived: !assortment.policy.archived,
                            }
                        })}
                    >
                        {assortment.policy.archived ? "撤銷封存" : "封存集合"}
                    </AnchorButton>
                }
            </section>
            <section>
                {
                    assortment.items.map((item, index) => {
                        const key = item.id + index;
                        return (
                            <AssortmentItemCard
                                key={key}
                                item={item}
                                index={index}
                                assortment={assortment}
                                collector={users[item.collector]}
                                lastReviewer={users[item.lastReviewer]}
                                canEdit={canEdit}
                                dispatch={dispatch}
                            >
                                <AssortmentItemSummary
                                    item={item}
                                    entities={state.entities}
                                />
                            </AssortmentItemCard>
                        );
                    })
                }
            </section>
        </div>
    );
}