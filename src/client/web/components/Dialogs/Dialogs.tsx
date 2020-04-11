import { MaltaaDispatch } from "../../uiUtils";
import { AuthenticateDialog } from "./AuthenticateDialog";
import { maltaaApi } from "../../maltaaApiClient";
import { PreferencesDialog } from "./PreferencesDialog";
import * as React from "react";
import { DialogContainer } from "./DialogContainer";
import {ClientUIState} from "../../states/uiReducer";
import {ClientState} from "../../states/reducer";

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
                    onRegisterWithMatters={async (username, password) => {
                        const data = await maltaaApi.registerWithMatters(username, password);
                    }}
                    onRegister={((username, password) => dispatch({
                        type: "Register",
                        username,
                        password,
                        preferences: state.preferences,
                    }))}
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
        </DialogContainer>
    )
}
