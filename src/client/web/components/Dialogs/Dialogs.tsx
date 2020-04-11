import * as React from "react";
import { MaltaaDispatch } from "../../uiUtils";
import { AuthenticateDialog } from "./AuthenticateDialog";
import { PreferencesDialog } from "./PreferencesDialog";
import { DialogContainer } from "./DialogContainer";
import {ClientUIState} from "../../states/uiReducer";
import {ClientState} from "../../states/reducer";
import {MeDialog} from "./MeDialog";

export function Dialogs(props: {
    dialogState: ClientUIState["dialog"],
    dispatch: MaltaaDispatch,
    state: ClientState,
}) {
    const {dialogState, dispatch, state} = props;
    if (!dialogState) {
        return null;
    }
    return (
        <DialogContainer
            onHide={() => dispatch({
                type: "CancelDialog"
            })}
        >
            {
                dialogState === "auth" &&
                <AuthenticateDialog
                    onRegister={((username, password) =>
                        dispatch({
                            type: "Register",
                            username,
                            password,
                            preferences: state.preferences,
                        }))
                    }
                    onRegisterWithMatters={(username, password) => {
                        dispatch({
                            type: "Register",
                            username,
                            password,
                            preferences: state.preferences,
                            externalPlatform: "matters",
                        })
                    }}
                />
            }
            {
                dialogState === "preferences" &&
                <PreferencesDialog
                    preferences={state.preferences}
                    users={state.entities.users}
                    dispatch={dispatch}
                />
            }
            {
                dialogState === "me" &&
                <MeDialog />
            }

        </DialogContainer>
    )
}
