import * as React from "react";
import "./UserLabel.css";

import { UserPublic } from "../../../../definitions/User";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import { USER_URL_SIGIL } from "../../../../settings";
import { getAnchorClickHandler } from "../../uiUtils";

export function UserLabel(props: {
    user?: UserPublic | null,
    surpressAnchor?: boolean
    onClick?(): any,
}) {
    const {user} = props;
    if (!user) {
        return null;
    }
    const content = <span>{user.displayName}</span>;
    if (props.surpressAnchor) {
        return (
            <span className="UserLabel" onClick={getAnchorClickHandler(props.onClick)}>{content}</span>
        );
    }
    else {
        return (
            <AnchorButton
                href={`/${USER_URL_SIGIL}${user.userName}`}
                onClick={getAnchorClickHandler(props.onClick)}
            >
                <bdi>{content}</bdi>
            </AnchorButton>
        );
    }
}
