import * as React from "react";
import {AccountSelf, ObjectMap, UserPublic} from "../../../../definitions/data-types";
import {AnchorButton} from "../AnchorButton/AnchorButton";
import {MaltaaDispatch} from "../../uiUtils";
import { useState } from "react";
import { AuthenticateDialog } from "./AuthenticateDialog";
import { AuthForm } from "./AuthForm";

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
        )
    }
    return (
        <div className="MeDialog">
            <div>
                已連接的Matters賬戶
                {
                    me.mattersIds.map(id => (
                        <div key={id}>
                            {id}
                        </div>
                    ))
                }
                <AnchorButton
                    onClick={() => setConnecting(true)}
                >
                    新連接賬戶
                </AnchorButton>
                {
                    connecting &&
                    <AuthForm />
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
    )
}