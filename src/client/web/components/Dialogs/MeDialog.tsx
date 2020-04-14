import * as React from "react";
import { useState } from "react";

import { AccountSelf } from "../../../../definitions/MaltaaAccount";
import { ObjectMap } from "../../../../definitions/Objects";
import { UserPublic } from "../../../../definitions/User";

import { AnchorButton } from "../AnchorButton/AnchorButton";
import { MaltaaDispatch } from "../../uiUtils";
import { AuthForm } from "./AuthForm";
import { USER_URL_SIGIL } from "../../../../settings";

export function MeDialog(props: {
    me: AccountSelf | null,
    users: ObjectMap<UserPublic>,
    dispatch: MaltaaDispatch,
}) {
    const {me, users, dispatch} = props;
    const [connecting, setConnecting] = useState(false);
    if (!me) {
        return (
            <div className="MeDialog">
                未登入
            </div>
        );
    }
    return (
        <div className="MeDialog">
            <h1>
                我的賬戶
            </h1>
            <div>
                {me.username}
            </div>
            <div>
                已連接的Matters賬戶
                <ol>
                    {
                        me.mattersIds.map(id => {
                            const user = users[id];
                            return (
                                <li key={id}>
                                    {user.displayName}({USER_URL_SIGIL}{user.userName})
                                </li>
                            );
                        })
                    }
                </ol>
                <AnchorButton
                    onClick={() => setConnecting(true)}
                >
                    新連接賬戶
                </AnchorButton>
                {
                    connecting &&
                    <AuthForm
                        onRegisterWithMatters={(username, password) => {
                            dispatch({
                                type: "Register",
                                username,
                                password,
                                externalPlatform: "matters",
                            });
                        }}
                    />
                }
            </div>
            <div>
                <AnchorButton
                    onClick={() => dispatch({
                        type: "Signout",
                    })}
                >
                    登出
                </AnchorButton>
            </div>
        </div>
    );
}