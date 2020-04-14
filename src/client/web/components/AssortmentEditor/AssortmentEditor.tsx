import * as React from "react";
import { useState } from "react";

import { ClientState } from "../../states/reducer";
import { AssortmentContentType } from "../../../../definitions/Assortment";
import { UserPublic } from "../../../../definitions/User";

import { Chooser } from "../Chooser/Chooser";

import { assortmentUrl, MaltaaDispatch, OptionList } from "../../uiUtils";
import { OperatorSelector } from "../OperatorSelector";

const entityTypeOptions: OptionList<AssortmentContentType> = [
    {
        value: "article",
        label: "文選"
    },
    {
        value: "user",
        label: "名冊"
    },
    {
        value: "mixed",
        label: "什錦"
    },
];

export function AssortmentEditor(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    const me = state.entities.me;
    const [contentType, setContentType] = useState<AssortmentContentType>("article");
    const owner: UserPublic | null = state.preferences.identity.operator ? state.entities.users[state.preferences.identity.operator] : null;
    const [title, setTitle] = useState("");
    const [subpath, setSubpath] = useState("");

    if (!owner) {
        return (
            <OperatorSelector
                state={state}
                dispatch={dispatch}
            />
        )
    }
    return (
        <div className="AssortmentEditor">
            {
                me &&
                <Chooser
                    options={me.mattersIds.map(id => ({value: id, label: id}))}
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
            }
            <Chooser
                options={entityTypeOptions}
                chosen={contentType}
                onChoose={setContentType}
            />
            <div>
                <div>
                    {assortmentUrl({ownerUsername: owner.userName, contentType, subpath: ""})}
                    <input
                        value={subpath}
                        onChange={event => setSubpath(event.target.value)}
                        placeholder={"路徑"}
                    />
                </div>
                <input
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    placeholder={"標題"}
                />
            </div>
            <button
                onClick={() => {
                    dispatch({
                        type: "CreateAssortment",
                        subpath,
                        title,
                        upstreams: [],
                        contentType: contentType,
                        items: [],
                    })
                }}
            >
                create
            </button>
        </div>
    )
}