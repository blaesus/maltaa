import * as React from "react";
import { useState } from "react";

import { AssortmentSummary } from "../AssortmentSummary/AssortmentSummary";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { Assortment } from "../../../../definitions/Assortment";
import { hasIntersection } from "../../../../utils";
import { ClientState } from "../../states/reducer";
import { Article } from "../../../../definitions/Article";
import { MaltaaDispatch } from "../../uiUtils";

export function AssortmentList(props: {
    state: ClientState,
    article: Article,
    dispatch: MaltaaDispatch,
}) {
    const {state, article, dispatch} = props;
    const [addingToMyAssortments, setAddingToMyAssortments] = useState(false);
    const addedAssortments =
        Object.values(state.entities.assortments)
              .filter(a => a.items.some(item => item.id === article.id));
    const myAssortmentsForAdding: Assortment[] =
        Object.values(state.entities.assortments)
              .filter(a =>
                  !a.archived &&
                  (a.contentType === "anthology" || a.contentType === "mixture") &&
                  addedAssortments.every(includedAssortment => includedAssortment.id !== a.id) &&
                  hasIntersection(a.editors, state.entities.me?.mattersIds),
              );
    return (
        <div className="AssortmentList">

            {
                addedAssortments.length === 0 && `未有集合收錄本文`
            }

            {
                addedAssortments.length > 0 && `${addedAssortments.length}個集合收錄本文`
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
                <AnchorButton onClick={() => setAddingToMyAssortments(true)}>加入我的集合</AnchorButton>
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
                                            entityType: "article",
                                            id: article.id,
                                            note: "",
                                        },
                                    });
                                }}>
                                    加入{assortment.title}
                                </AnchorButton>
                            </div>
                        );
                    })
            }
        </div>
    );
}

