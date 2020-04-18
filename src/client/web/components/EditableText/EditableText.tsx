import * as React from "react";
import { useState } from "react";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import "./EditableText.css"

export function EditableText(props: {
    content: string,
    canEdit: boolean,
    onEdit(content: string): void
}) {
    const {content, canEdit, onEdit} = props;
    const [editing, setEditing] = useState(false);
    const [newContent, setNewContent] = useState(content);
    return (
        <div className="EditableText">
            {!editing && props.content}
            {
                editing &&
                <textarea
                    value={newContent}
                    onChange={event => setNewContent(event.target.value)}
                />
            }
            {
                canEdit && !editing &&
                <AnchorButton
                    onClick={() => setEditing(editing => !editing)}
                >
                    修改評語
                </AnchorButton>
            }
            {
                editing &&
                <>
                    <AnchorButton
                        onClick={() => {
                            onEdit(newContent);
                            setEditing(false);
                            setNewContent("");
                        }}
                    >
                        確定
                    </AnchorButton>
                    <AnchorButton
                        onClick={() => {
                            setEditing(false);
                            setNewContent("");
                        }}
                    >
                        取消
                    </AnchorButton>
                </>
            }
        </div>
    );
}
