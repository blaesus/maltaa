import * as React from "react";

import { ClientState } from "../states/reducer";

import { Chooser } from "./Chooser/Chooser";

import { MaltaaDispatch } from "../uiUtils";

export function OperatorSelector(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    return (
        <Chooser
            options={
                state.entities.me?.mattersIds.map(id => {
                    const user = state.entities.users[id];
                    return {
                        value: id,
                        label: user?.userName || id,
                    }
                })
            }
            chosen={state.preferences.identity.operator}
            onChoose={operator => dispatch({
                type: "SetMyPreferences",
                preferencesPatch: {
                    identity: {
                        ...state.preferences,
                        operator,
                    }
                }
            })}
        />
    )
}