import * as React from "react";
import { useState } from "react";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import "./EditableText.css"

export function EditableText(props: {
    content: string,
    canEdit: boolean,
    onEdit(content: string): void
    editButtonText?: string;
}) {
    const {content, canEdit, onEdit} = props;
    const [editing, setEditing] = useState(false);
    const [newContent, setNewContent] = useState(content);
    const editButtonText = props.editButtonText || "修改";
    return (
        <span className="EditableText">
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
                    {editButtonText}
                </AnchorButton>
            }
            {
                editing &&
                <>
                    <AnchorButton
                        onClick={() => {
                            onEdit(newContent);
                            setEditing(false);
                        }}
                    >
                        確定
                    </AnchorButton>
                    <AnchorButton
                        onClick={() => {
                            setEditing(false);
                        }}
                    >
                        取消
                    </AnchorButton>
                </>
            }
        </span>
    );
}
