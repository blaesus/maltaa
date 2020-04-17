import * as React from "react";

import "./AssortmentSummary.css"

import { Assortment } from "../../../../definitions/Assortment";
import { assortmentUrl, getAnchorClickHandler } from "../../uiUtils";
import { assortmentNames } from "../../../../utils";
import { ObjectMap } from "../../../../definitions/Objects";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { UserPublic } from "../../../../definitions/User";

export function AssortmentSummary(props: {
    assortment: Assortment,
    owner?: UserPublic,
    onClick?(): void,
}) {
    const {assortment, owner, onClick} = props;
    if (!owner) {
        return null;
    }
    const url = assortmentUrl({
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
        </AnchorButton>
    )
}