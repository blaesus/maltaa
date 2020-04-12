import * as React from "react";
import { MaltaaDispatch } from "../../uiUtils";
import { ClientState } from "../../states/reducer";
import { assortmentNames } from "../../../../utils";

export function AssortmentPage(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state} = props;
    const identifier = state.ui.pages.assortment.identifier;
    if (state.ui.pages.current !== "assortment" || !identifier) {
        return null;
    }
    const owner = Object.values(state.entities.users).find(u => u.userName === identifier.ownerUsername);
    if (!owner) {
        return null;
    }
    const assortment = Object.values(state.entities.assortments).find(
        a => a.owner === owner.id
            && a.subpath === identifier.subpath
            && a.contentType === identifier.contentType
    )
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
                        return (
                            <div
                                key={item.id}
                            >
                                {item.id}
                            </div>
                        )
                    })
                }
            </div>

        </div>
    )
}