import * as React from "react";
import { ClientState } from "../../states/reducer";
import { useState } from "react";
import { assortmentUrl, MaltaaDispatch } from "../../uiUtils";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { AssortmentEditor } from "../AssortmentEditor/AssortmentEditor";
import {assortmentNames} from "../../../../utils";
import { AssortmentSummary } from "../AssortmentSummary/AssortmentSummary";
export function ExplorePage(props: {
    state: ClientState,
    dispatch: MaltaaDispatch
}) {
    const {state, dispatch} = props;
    const [creatingAssortment, setCreatingAssortment] = useState(false);

    if (state.ui.pages.current !== "explore") {
        return null;
    }
    return (
        <div className="ExplorePage">
            Explore
            <AnchorButton onClick={() => setCreatingAssortment(true)}>
                開創文選
            </AnchorButton>

            <div>
                {
                    Object.values(state.entities.assortments)
                        .map(assortment =>
                            <AssortmentSummary
                                key={assortment.id}
                                assortment={assortment}
                                users={state.entities.users}
                            />
                        )
                }
            </div>

            <AssortmentEditor
                state={state}
                dispatch={dispatch}
            />
        </div>
    )
}

