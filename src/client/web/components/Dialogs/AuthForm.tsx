import * as React from "react";
import { AnchorButton } from "../AnchorButton/AnchorButton";

export type AuthPlatform = "maltaa" | "matters";

export function AuthForm(props: {
    onRegister?(username: string, password: string): void
    onRegisterWithMatters?(username: string, password: string): void,
    onSignin?(username: string, password: string): void
    forcePlatform?: AuthPlatform;
}) {
    const [mode, setMode] = React.useState<"signin" | "signup">("signin");
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [platform, setPlatform] = React.useState<AuthPlatform>(props.forcePlatform || "maltaa");
    return (
        <form className="AuthForm">
            <h1>
                <AnchorButton
                    onClick={() => setMode(mode => mode === "signin" ? "signup" : "signin")}
                >
                    {mode === "signin" ? "登入" : "註冊"}
                </AnchorButton>
            </h1>
            <input
                value={username}
                type="email"
                onChange={event => setUsername(event.target.value)}
                required={true}
            />
            <input
                value={password}
                type="password"
                onChange={event => setPassword(event.target.value)}
                required={true}
            />
            <button
                onClick={event => {
                    event.preventDefault();
                    if (mode === "signup") {
                        switch (platform) {
                            case "matters": {
                                props.onRegisterWithMatters && props.onRegisterWithMatters(username, password);
                                break;
                            }
                            case "maltaa": {
                                props.onRegister && props.onRegister(username, password);
                                break;
                            }
                        }
                    }
                    else if (mode === "signin") {
                        props.onSignin && props.onSignin(username, password);
                    }
                }}
            >
                {mode === "signin" ? "登入" : "註冊"}
            </button>
            {
                platform === "matters" &&
                <div>Maltaa不会记录你的Matters账户名与密码</div>
            }
            <div>
                {
                    mode === "signup" &&
                    <a
                        onClick={() => setPlatform(platform =>  {
                            if (platform === "maltaa") {
                                return "matters"
                            }
                            else {
                                return "maltaa"
                            }
                        })}
                    >
                        {platform === "maltaa" && "连接已有Matters账户"}
                        {platform === "matters" && "单独注册Maltaa账户"}
                    </a>
                }
            </div>
        </form>
        )
}