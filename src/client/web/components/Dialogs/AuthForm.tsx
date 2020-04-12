import * as React from "react";

export type AuthPlatform = "maltaa" | "matters";

export function AuthForm(props: {
    onRegister?(username: string, password: string): void
    onRegisterWithMatters?(username: string, password: string): void,
    forcePlatform?: AuthPlatform;
}) {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [platform, setPlatform] = React.useState<AuthPlatform>(props.forcePlatform || "maltaa");
    return (
        <form className="AuthForm">
            <h1>
                注册
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
                }}
            >
                连接
            </button>
            {
                platform === "matters" &&
                <div>Maltaa不会记录你的Matters账户名与密码</div>
            }
            <div>
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
            </div>
        </form>
        )
}