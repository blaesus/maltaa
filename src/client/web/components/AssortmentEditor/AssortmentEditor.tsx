import * as React from "react";
import {useState} from "react";
import {MaltaaDispatch} from "../../uiUtils";
import {AssortmentId, AssortmentItem, MattersEntityType} from "../../../../definitions/assortment";

export function AssortmentEditor(props: {
    dispatch: MaltaaDispatch,
}) {
    const [title, setTitle] = useState("");
    return (
        <div className="AssortmentEditor">
            <div>assortment editor</div>
            <div>
                <input value={title} onChange={event => setTitle(event.target.value)} />
            </div>
            <button
                onClick={() => {
                    props.dispatch({
                        type: "CreateAssortment",
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