import * as React from "react";
import * as ReactDom from "react-dom";
import { UserPublic } from "../data-types";
import { useEffect, useState } from "react";

const maltaApi = {
    async getUserById(id: string): Promise<UserPublic | null> {
        const response = await fetch(`/api/user/${id}`);
        if (response.status === 200) {
            return await response.json()
        }
        else {
            return null
        }
    }
};

function MaltaWeb() {
    let [input, setInput] = useState("");
    let [user, setUser] = useState<UserPublic | null>(null);
    return (
        <div>
            <h1>Malta</h1>
            <input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder={"User Id"}
            />
            <button
                onClick={async () => {
                    const user = await maltaApi.getUserById(input);
                    if (user) {
                        setUser(user);
                    }
                    else {
                        alert("No body");
                    }
                }}
            >
                check
            </button>
            {
                user &&
                <div>
                    {
                        JSON.stringify(user)
                    }
                </div>
            }
        </div>
    )
}

ReactDom.render(<MaltaWeb />, document.getElementById("ROOT"));
