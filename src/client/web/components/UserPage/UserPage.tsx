import * as React from "react";

import "./UserPage.css";

import { UserId, UserPublic } from "../../../../definitions/User";

import { AnchorButton } from "../AnchorButton/AnchorButton";

import { USER_URL_SIGIL } from "../../../../settings";
import { readableDateTime } from "../../../../utils";


export function UserPage(props: {
    user?: UserPublic,
    screenedUsers: UserId[],
    onToggleScreen(id: UserId): any,
}) {
    const {user} = props;
    if (!user) {
        return <span>...</span>;
    }
    return (
        <div className="UserPage">
            <h1>
                {user.displayName}(<span>{USER_URL_SIGIL}{user.userName}</span>)
            </h1>
            <div className="Description">
                {user.info.description}
            </div>
            <div>
                註冊於{readableDateTime(user.info.createdAt)}
            </div>

            <div>
                <AnchorButton
                    onClick={() => props.onToggleScreen(user.id)}
                >
                    {props.screenedUsers.includes(user.id) ? "取消屏蔽" : "屏蔽"}
                </AnchorButton>
            </div>

        </div>

    )
}
