import * as React from "react";

import { Assortment } from "../../../../definitions/assortment";
import { assortmentUrl } from "../../uiUtils";
import { assortmentNames } from "../../../../utils";
import { ObjectMap, UserPublic } from "../../../../definitions/data-types";

export function AssortmentSummary(props: {
    assortment: Assortment,
    users: ObjectMap<UserPublic>,
}) {
    const {assortment, users} = props;
    const owner = users[assortment.owner];
    const url = assortmentUrl({
        ownerUsername: owner.userName,
        contentType: assortment.contentType,
        subpath: assortment.subpath,
    });
    return (
        <div key={assortment.id}>
            {assortmentNames[assortment.contentType]}
            {assortment.title}
            <a href={url}>{url}</a>
        </div>
    )
}