import * as React from "react";

import { Assortment } from "../../../../definitions/assortment";
import { assortmentUrl, getAnchorClickHandler } from "../../uiUtils";
import { assortmentNames } from "../../../../utils";
import { ObjectMap, UserPublic } from "../../../../definitions/data-types";
import { AnchorButton } from "../AnchorButton/AnchorButton";

export function AssortmentSummary(props: {
    assortment: Assortment,
    users: ObjectMap<UserPublic>,
    onClick?(): void,
}) {
    const {assortment, users, onClick} = props;
    const owner = users[assortment.owner];
    const url = assortmentUrl({
        ownerUsername: owner.userName,
        contentType: assortment.contentType,
        subpath: assortment.subpath,
    });
    return (
        <AnchorButton
            key={assortment.id}
            href={url}
            onClick={getAnchorClickHandler(onClick)}
        >
            {assortmentNames[assortment.contentType]}
            {assortment.title}
        </AnchorButton>
    )
}