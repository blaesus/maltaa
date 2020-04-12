import * as React from "react";
import {useState} from "react";
import {MaltaaDispatch, OptionList} from "../../uiUtils";
import {AccountSelf, UserId, UserPublic} from "../../../../definitions/data-types";
import {ClientState} from "../../states/reducer";
import {USER_URL_SIGIL} from "../../../../settings";
import {Chooser} from "../Chooser/Chooser";
import {AssortmentContentType, MattersEntityType} from "../../../../definitions/assortment";


export const assortmentPrefix: {[key in AssortmentContentType]: string} = {
    article: "an",
    user: "rl",
    mixed: "mx",
};

function assortmentUrl(username: string, type: AssortmentContentType, subpath: string): string {
    return `/${USER_URL_SIGIL}${username}/${assortmentPrefix[type]}/${subpath}`;
}

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
            <div>assortment editor</div>
            <Chooser
                options={entityTypeOptions}
                chosen={contentType}
                onChoose={setContentType}
            />
            <div>
                <input
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    placeholder={"標題"}
                />
                <input
                    value={subpath}
                    onChange={event => setSubpath(event.target.value)}
                    placeholder={"路徑"}
                />
                <div>
                    {assortmentUrl(owner.userName, contentType, subpath)}
                </div>
            </div>
            <button
                onClick={() => {
                    dispatch({
                        type: "CreateAssortment",
                        subpath,
                        title,
                        upstreams: [],
                        contentType: contentType,
                        articles: [],
                    })
                }}
            >
                create
            </button>
        </div>
    )
}