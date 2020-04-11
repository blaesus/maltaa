import * as React from "react";
import {ClientState} from "../../states/reducer";
import {AnchorButton} from "../AnchorButton/AnchorButton";

export function ExplorePage(props: {
    state: ClientState,
}) {
    const {state} = props;

    if (state.ui.pages.current !== "explore") {
        return null;
    }
    return (
        <div className="ExplorePage">
            Explore
            <AnchorButton onClick={() => {}}>
                開創文選
            </AnchorButton>
        </div>
    )
}