import * as React from "react";
import { ClientState } from "../../states/reducer";
import { useState } from "react";
import { MaltaaDispatch } from "../../uiUtils";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { AssortmentEditor } from "../AssortmentEditor/AssortmentEditor";
import {assortmentNames, assortmentUrl} from "../../../../utils";

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
                        .map(assortment => {
                            const owner = state.entities.users[assortment.owner];
                            const url = assortmentUrl(owner.userName, assortment.contentType, assortment.subpath);
                            return (
                                <div key={assortment.id}>
                                    {assortmentNames[assortment.contentType]}
                                    {assortment.title}
                                    <a href={url}>{url}</a>
                                </div>
                            )
                        })
                }
            </div>

            <AssortmentEditor
                state={state}
                dispatch={dispatch}
            />
        </div>
    )
}