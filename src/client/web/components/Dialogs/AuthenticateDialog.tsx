import * as React from "react";
import "./AuthenticateDialog.css";
import { Chooser } from "../Chooser/Chooser";
import { AuthForm } from "./AuthForm";

export function AuthenticateDialog(props: {
    onRegister(username: string, password: string): void
    onRegisterWithMatters(username: string, password: string): void,
}) {
    return (
        <div className="AuthenticateDialog">
            <AuthForm
                onRegister={props.onRegister}
                onRegisterWithMatters={props.onRegisterWithMatters}
            />
        </div>
    )
}
