import * as React from "react";

import "./UserPage.css";

import { UserId, UserPublic } from "../../../../definitions/User";

import { AnchorButton } from "../AnchorButton/AnchorButton";

import { USER_URL_SIGIL } from "../../../../settings";
import { readableDateTime } from "../../../../utils";
import { AssortmentList } from "../AssortmentEditor/AssortmentList";
import { ClientState } from "../../states/reducer";
import { MaltaaDispatch } from "../../uiUtils";
import { useState } from "react";
import { ArticleList } from "../ArticleList/ArticleList";

type UserPageTab = "articles" | "comments";

export function UserPage(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    const {entities, ui: {pages}, preferences} = state;
    const [tab, setTab] = useState<UserPageTab>("articles");

    const user = Object.values(entities.users).find(user => user.userName === pages.user.name)

    const onToggleScreen= (userId: UserId) => {
        const currentlyScreened = state.preferences.data.screenedUsers.includes(userId);
        dispatch({
            type: "SetMyPreferences", preferencesPatch: {
                data: {
                    ...preferences.data,
                    screenedUsers:
                        currentlyScreened
                            ? state.preferences.data.screenedUsers.filter(u => u !== userId)
                            : [...state.preferences.data.screenedUsers, userId]
                }
            }
        })
    };

    if (pages.current !== "user") {
        return null;
    }
    else if (!user) {
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
                    onClick={() => onToggleScreen(user.id)}
                >
                    {preferences.data.screenedUsers.includes(user.id) ? "取消屏蔽" : "屏蔽"}
                </AnchorButton>
            </div>
            
            {
                tab === "articles" && state.ui.pages.user.articles &&
                <ArticleList state={state} page={state.ui.pages.user.articles} dispatch={dispatch} />
            }

            <AssortmentList
                entityId={user.id}
                entityType={"user"}
                state={state}
                dispatch={dispatch}
            />

        </div>
    )
}
