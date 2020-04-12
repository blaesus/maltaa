import * as React from "react";
import {useState} from "react";
import {assortmentUrl, MaltaaDispatch, OptionList} from "../../uiUtils";
import {UserId, UserPublic} from "../../../../definitions/data-types";
import {ClientState} from "../../states/reducer";
import {Chooser} from "../Chooser/Chooser";
import {AssortmentContentType} from "../../../../definitions/assortment";

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
        label: "雜燴"
    },
];

export function AssortmentEditor(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    const me = state.entities.me;
    const [activeMattersId, setActiveMattersId] = useState<UserId | null>(me ? me.mattersIds[0] : null);
    const [contentType, setContentType] = useState<AssortmentContentType>("article");
    const owner: UserPublic | null = activeMattersId ? state.entities.users[activeMattersId] : null;
    const [title, setTitle] = useState("");
    const [subpath, setSubpath] = useState("");

    if (!owner) {
        return (
            <div className="AssortmentEditor">
                缺少用戶數據
            </div>
        )
    }
    return (
        <div className="AssortmentEditor">
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
                        meta: {
                            asUser: owner.id,
                        }
                    })
                }}
            >
                create
            </button>
        </div>
    )
}