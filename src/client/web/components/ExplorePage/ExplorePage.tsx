import * as React from "react";
import {ClientState} from "../../states/reducer";
import {AnchorButton} from "../AnchorButton/AnchorButton";
import {useState} from "react";
import {AssortmentEditor} from "../AssortmentEditor/AssortmentEditor";
import {MaltaaDispatch} from "../../uiUtils";

export function ExplorePage(props: {
    state: ClientState,
    dispatch: MaltaaDispatch
}) {
    const {state, dispatch} = props;
    const [creatingAssortment, setCreatingAssortment] = useState(false);

    if (state.ui.pages.current !== "explore") {
        return null;
    }
    return (
        <div className="ExplorePage">
            Explore
            <AnchorButton onClick={() => setCreatingAssortment(true)}>
                開創文選
            </AnchorButton>

            <AssortmentEditor
                dispatch={dispatch}
            />


        </div>
    )
}