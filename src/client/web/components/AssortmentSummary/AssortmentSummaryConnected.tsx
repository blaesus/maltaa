import { AssortmentId } from "../../../../definitions/Assortment";
import { assortmentPath } from "../../uiUtils";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import * as React from "react";
import { ClientState } from "../../states/reducer";

export function AssortmentSummaryConnected(props: {
    id: AssortmentId,
    state: ClientState,
    onClick?(): void,
}) {
    const {id, state, onClick} = props;
    const assortment = state.entities.assortments[id];
    if (!assortment) {
        return <div>{id}</div>;
    }
    const owner = state.entities.users[assortment.owner];
    let url: string | undefined;
    if (owner) {
        url = assortmentPath({
            ownerUsername: owner.userName,
            contentType: assortment.contentType,
            subpath: assortment.subpath,
        });
    }
    return (
        <AnchorButton
            key={assortment.id}
            className="AssortmentSummary"
            href={url}
            onClick={onClick}
        >
            {assortment.title}
            ({assortment.items.length})
        </AnchorButton>
    );
}