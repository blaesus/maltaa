import * as React from "react";

import "./AssortmentSummary.css";

import { Assortment } from "../../../../definitions/Assortment";
import { assortmentPath, getAnchorClickHandler } from "../../uiUtils";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { UserPublic } from "../../../../definitions/User";

export function AssortmentSummary(props: {
    assortment: Assortment,
    owner?: UserPublic,
    onClick?(): void,
}) {
    const {assortment, owner, onClick} = props;
    const url = owner && assortmentPath({
        ownerUsername: owner.userName,
        contentType: assortment.contentType,
        subpath: assortment.subpath,
    });
    return (
        <AnchorButton
            key={assortment.id}
            className="AssortmentSummary"
            href={url}
            onClick={getAnchorClickHandler(onClick)}
        >
            {assortment.title}
            ({assortment.items.length})
        </AnchorButton>
    );
}