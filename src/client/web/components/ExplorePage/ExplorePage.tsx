import * as React from "react";
import {ClientState} from "../../states/reducer";
import {AnchorButton} from "../AnchorButton/AnchorButton";
import {useState} from "react";

export function ExplorePage(props: {
    state: ClientState,
}) {
    const {state} = props;
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

            {
                creatingAssortment && ""
            }
        </div>
    )
}