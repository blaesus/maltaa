import * as React from "react";
import { Dispatch, useState } from "react";

import { ClientState } from "../../states/reducer";
import { MaltaaDispatch } from "../../uiUtils";

import { AnchorButton } from "../AnchorButton/AnchorButton";
import { AssortmentSummary } from "../AssortmentSummary/AssortmentSummary";
import { assortmentNames, hasIntersection } from "../../../../utils";
import { Assortment, AssortmentContentType } from "../../../../definitions/Assortment";
import { ObjectMap } from "../../../../definitions/Objects";
import { UserPublic } from "../../../../definitions/User";
import { AssortmentCreator } from "../AssortmentEditor/AssortmentCreator";

function AssortmentList(props: {
    assortments: Assortment[],
    users: ObjectMap<UserPublic>,
    dispatch: MaltaaDispatch
}) {
    const { assortments, users, dispatch } = props;
    return (
        <>
            {
                assortments.map(assortment => (
                    <AssortmentSummary
                        key={assortment.id}
                        assortment={assortment}
                        owner={users[assortment.owner]}
                        onClick={() => {
                            dispatch({
                                type: "ViewAssortment",
                                assortment: assortment.id,
                            })
                        }}
                    />
                ))
            }
        </>
    )
}

function AssortmentSection(props: {
    contentType: AssortmentContentType,
    myAssortments: Assortment[],
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {contentType, myAssortments, state, dispatch} = props;
    const [creating, setCreating] = useState(false);
    const assortments = myAssortments.filter(a => a.contentType === contentType);
    const assortmentName = assortmentNames[contentType];
    return (
        <section>
            <h2>我的{assortmentName}</h2>
            <AssortmentList
                assortments={assortments}
                users={state.entities.users}
                dispatch={dispatch}
            />
            <AnchorButton onClick={() => setCreating(creating => !creating)}>
                新创{assortmentName}
            </AnchorButton>
            {
                creating &&
                <AssortmentCreator
                    state={state}
                    dispatch={dispatch}
                    fixedContentType={contentType}
                />
            }
        </section>
    )
}

export function Study(props: {
    state: ClientState,
    dispatch: MaltaaDispatch
}) {
    const {state, dispatch} = props;

    if (state.ui.pages.current !== "study") {
        return null;
    }
    const myAssortments = Object.values(state.entities.assortments)
                                .filter(a =>
                                    hasIntersection(a.editors, state.entities.me?.mattersIds)
                                );
    return (
        <div className="Study">
            <AssortmentSection
                contentType={"article"}
                myAssortments={myAssortments}
                state={state}
                dispatch={dispatch}
            />
            <AssortmentSection
                contentType={"user"}
                myAssortments={myAssortments}
                state={state}
                dispatch={dispatch}
            />
            <AssortmentSection
                contentType={"mixed"}
                myAssortments={myAssortments}
                state={state}
                dispatch={dispatch}
            />
        </div>
    )
}

