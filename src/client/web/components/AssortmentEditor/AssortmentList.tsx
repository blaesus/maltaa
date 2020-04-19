import * as React from "react";
import { useState } from "react";

import { AssortmentSummary } from "../AssortmentSummary/AssortmentSummary";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { Assortment, MattersEntityType } from "../../../../definitions/Assortment";
import { assortmentEntityTypes, hasIntersection } from "../../../../utils";
import { ClientState } from "../../states/reducer";
import { ArticleId } from "../../../../definitions/Article";
import { MaltaaDispatch } from "../../uiUtils";
import { UserId } from "../../../../definitions/User";

export function AssortmentList(props: {
    entityId: ArticleId | UserId,
    entityType: MattersEntityType,
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, entityId, entityType, dispatch} = props;
    const [addingToMyAssortments, setAddingToMyAssortments] = useState(false);
    const addedAssortments =
        Object.values(state.entities.assortments)
              .filter(a => a.items.some(item => item.id === entityId));
    const myAssortmentsForAdding: Assortment[] =
        Object.values(state.entities.assortments)
              .filter(a =>
                  !a.policy.archived &&
                  (assortmentEntityTypes[a.contentType].includes(entityType)) &&
                  addedAssortments.every(includedAssortment => includedAssortment.id !== a.id) &&
                  hasIntersection(a.editors, state.entities.me?.mattersIds),
              );
    return (
        <div className="AssortmentList">
            {
                addedAssortments.length === 0 && `未有集合收錄`
            }
            {
                addedAssortments.length > 0 && `${addedAssortments.length}個集合收錄`
            }
            {
                addedAssortments.map(assortment => (
                    <AssortmentSummary
                        key={assortment.id}
                        assortment={assortment}
                        owner={state.entities.users[assortment.owner]}
                        onClick={() => {
                            dispatch({
                                type: "ViewAssortment",
                                assortment: assortment.id,
                            });
                        }}
                    />
                ))
            }
            {
                !addingToMyAssortments &&
                <AnchorButton onClick={() => setAddingToMyAssortments(true)}>錄入我的集合</AnchorButton>
            }
            {
                addingToMyAssortments &&
                myAssortmentsForAdding
                    .map(assortment => {
                        return (
                            <div key={assortment.id}>
                                <AnchorButton onClick={() => {
                                    dispatch({
                                        type: "UpdateAssortment",
                                        operation: "AddItem",
                                        target: assortment.id,
                                        item: {
                                            source: "matters",
                                            entityType: entityType,
                                            id: entityId,
                                            review: "",
                                        },
                                    });
                                }}>
                                    錄入{assortment.title}
                                </AnchorButton>
                            </div>
                        );
                    })
            }
        </div>
    );
}

