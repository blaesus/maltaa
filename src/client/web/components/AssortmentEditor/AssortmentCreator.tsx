import * as React from "react";
import { useState } from "react";

import { ClientState } from "../../states/reducer";
import { AssortmentContentType, AssortmentId } from "../../../../definitions/Assortment";
import { UserPublic } from "../../../../definitions/User";

import { Chooser } from "../Chooser/Chooser";

import { assortmentPath, MaltaaDispatch, OptionList } from "../../uiUtils";
import { OperatorSelector } from "../OperatorSelector";
import { SubpathInput } from "./SubpathInput";

const entityTypeOptions: OptionList<AssortmentContentType> = [
    {
        value: "anthology",
        label: "文選"
    },
    {
        value: "roll",
        label: "名冊"
    },
    {
        value: "mixture",
        label: "什錦"
    },
];

export function AssortmentCreator(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
    fixedContentType?: AssortmentContentType,
    upstreams?: AssortmentId[],
}) {
    const {state, dispatch, fixedContentType} = props;
    const me = state.entities.me;
    const [contentType, setContentType] = useState<AssortmentContentType>(props.fixedContentType || "anthology");
    const owner: UserPublic | null = state.preferences.identity.operator ? state.entities.users[state.preferences.identity.operator] : null;
    const [title, setTitle] = useState("");
    const [subpath, setSubpath] = useState("");
    const upstreams = props.upstreams || [];

    if (!owner) {
        return (
            <OperatorSelector
                state={state}
                dispatch={dispatch}
            />
        )
    }
    return (
        <div className="AssortmentCreator">
            {
                me && (me.mattersIds.length >= 2) &&
                <OperatorSelector
                    state={state}
                    dispatch={dispatch}
                />
            }
            {
                !fixedContentType &&
                <Chooser
                    options={entityTypeOptions}
                    chosen={contentType}
                    onChoose={setContentType}
                />
            }
            <div>
                <SubpathInput
                    pathPrefix={assortmentPath({ownerUsername: owner.userName, contentType, subpath: ""})}
                    subpath={subpath}
                    onChange={setSubpath}
                />
                <input
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    placeholder={"標題"}
                />
            </div>
            <button
                onClick={() => {
                    setTitle("");
                    setSubpath("");
                    dispatch({
                        type: "CreateAssortment",
                        subpath,
                        title,
                        contentType,
                        upstreams,
                        items: [],
                    })
                }}
            >
                新創
            </button>
        </div>
    )
}