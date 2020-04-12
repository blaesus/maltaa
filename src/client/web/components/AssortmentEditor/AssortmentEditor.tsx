import * as React from "react";
import {useState} from "react";
import {MaltaaDispatch} from "../../uiUtils";
import {AccountSelf, UserId, UserPublic} from "../../../../definitions/data-types";
import {ClientState} from "../../states/reducer";

function assortmentUrl(username: string, subpath: string): string {
    return `/${username}/${subpath}`;
}

export function AssortmentEditor(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {state, dispatch} = props;
    const me = state.entities.me;
    const [activeMattersId, setActiveMattersId] = useState<UserId | null>(me ? me.mattersIds[0] : null);
    const owner: UserPublic | null = activeMattersId ? state.entities.users[activeMattersId] : null;
    console.info(activeMattersId, owner);
    const [title, setTitle] = useState("");
    const [subpath, setSubpath] = useState("");

    if (!owner) {
        return null;
    }
    return (
        <div className="AssortmentEditor">
            <div>assortment editor</div>
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
                    {assortmentUrl(owner.userName, subpath)}
                </div>
            </div>
            <button
                onClick={() => {
                    props.dispatch({
                        type: "CreateAssortment",
                        subpath,
                        title,
                        upstreams: [],
                        limitContentType: null,
                        articles: [],
                    })
                }}
            >
                create
            </button>
        </div>
    )
}