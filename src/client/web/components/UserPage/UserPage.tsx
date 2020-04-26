import * as React from "react";
import { useEffect, useState } from "react";

import "./UserPage.css";

import { UserId } from "../../../../definitions/User";
import { ClientState } from "../../states/reducer";
import { MaltaaDispatch } from "../../uiUtils";
import { ArticleSort } from "../../../../sorts";
import { UserPageTab } from "../../../../definitions/UI";

import { AnchorButton } from "../AnchorButton/AnchorButton";
import { Chooser, OptionList } from "../Chooser/Chooser";
import { CommentContent } from "../ArticlePage/CommentTree/CommentContent";
import { AssortmentList } from "../AssortmentEditor/AssortmentList";
import { ArticleList } from "../ArticleList/ArticleList";
import { ArticleListCursorControl } from "../ArticleList/ArticleListCursorControl";

import { USER_URL_SIGIL } from "../../../../settings";
import { INFINITY_JSON, readableDateTime } from "../../../../utils";
import { userIdToSerial } from "../../../../mattersSpecifics";


const TabOptions: OptionList<UserPageTab> = [
    {
        value: "articles",
        label: "文章",
    },
    {
        value: "comments",
        label: "評論",
    },
];

export function UserPage(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    const {entities, ui: {pages}, preferences} = state;
    const tab = pages.user.tab;

    const user = Object.values(entities.users).find(user => user.userName === pages.user.name);

    useEffect(() => {
        if (tab === "comments" && user) {
            dispatch({
                type: "LoadComments",
                sort: pages.user.comments.sort,
                pageNumber: pages.user.comments.pagination.nextPage,
                author: user.id,
            })
        }
    }, [tab])

    const onToggleScreen = (userId: UserId) => {
        const currentlyScreened = state.preferences.data.screenedUsers.includes(userId);
        dispatch({
            type: "SetMyPreferences", preferencesPatch: {
                data: {
                    ...preferences.data,
                    screenedUsers:
                        currentlyScreened
                            ? state.preferences.data.screenedUsers.filter(u => u !== userId)
                            : [...state.preferences.data.screenedUsers, userId],
                },
            },
        });
    };

    if (pages.current !== "user") {
        return null;
    }
    else if (!user) {
        return <span>...</span>;
    }
    const screened = preferences.data.screenedUsers.includes(user.id);
    return (
        <div className="UserPage">
            <h1>
                {user.displayName}(<span>{USER_URL_SIGIL}{user.userName}</span>)
            </h1>
            <div className="Description">
                {user.info.description}
            </div>
            <div title={`#${userIdToSerial(user.id, atob)}`}>
                註冊於{readableDateTime(user.info.createdAt)}
            </div>

            <div>
                <AnchorButton
                    onClick={() => onToggleScreen(user.id)}
                >
                    {screened ? "取消屏蔽" : "屏蔽"}
                </AnchorButton>
            </div>

            <AssortmentList
                entityId={user.id}
                entityType={"user"}
                state={state}
                dispatch={dispatch}
            />

            {
                !screened &&
                <section>
                    <Chooser
                        options={TabOptions}
                        chosen={tab}
                        onChoose={chosenTab => {
                            dispatch({
                                type: "ViewUser",
                                username: user.userName,
                                tab: chosenTab,
                            })
                        }}
                    />
                    {
                        tab === "articles" &&
                        <ArticleListCursorControl
                            mode="user"
                            listSetting={state.ui.pages.user.articles}
                            dispatch={dispatch}
                        >
                            <ArticleList state={state} mode="user" dispatch={dispatch}/>
                        </ArticleListCursorControl>
                    }
                    {
                        tab === "comments" &&
                        <div>
                            {
                                Object.values(state.entities.comments)
                                      .filter(c => c.author === user.id)
                                      .map(c => (
                                          <CommentContent
                                              key={c.id}
                                              comment={c}
                                              author={user}
                                              onAuthorClick={() => {}}
                                          />
                                      ))
                            }
                        </div>
                    }
                </section>
            }
        </div>
    );
}
