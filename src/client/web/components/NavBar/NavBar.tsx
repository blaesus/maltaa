import * as React from "react";
import "./NavBar.css";
import { MaltaaDispatch } from "../../uiUtils";
import {ClientState} from "../../states/reducer";
import {AnchorButton} from "../AnchorButton/AnchorButton";

function MenuItem(props: {
    title: string,
    onClick(): void,
}) {
    return (
        <AnchorButton onClick={props.onClick}>
            {props.title}
        </AnchorButton>
    )
}

export function NavBar(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {dispatch} = props;
    const [input, setInput] = React.useState("");
    const [extendMain, setExtendMain] = React.useState(false);

    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setExtendMain(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    function onHomeClick() {
        dispatch({type: "GoHome"});
        window.scrollTo(0, 0); 
    }

    return (
        <div className="NavBarContainer">
            <nav className="NavBar" ref={ref}>
                <div className="Content">
                    <a className="HomeButton" onClick={onHomeClick}>
                        Maltaa
                    </a>

                    <span className="RightSection">
                        <input
                            className="SearchInput"
                            value={input}
                            onChange={event => {
                                setInput(event.target.value);
                            }}
                            onKeyDown={event => {
                                if (event.key === "Enter") {
                                    setInput("");
                                    dispatch({type: "Search", keyword: input});
                                }
                            }}
                        />

                        <div className="MenuContainer">
                            <a
                                className="MenuButton"
                                onClick={() => setExtendMain(extend => !extend)}
                            >
                                ☰
                            </a>
                            <div className={`MainMenu ${extendMain ? "extend" : ""}`}>
                                <MenuItem
                                    onClick={() => dispatch({type: "StartPreferencesDialog"})}
                                    title="設置"
                                />
                                <MenuItem
                                    onClick={() => dispatch({type: "StartAuthenticationDialog"})}
                                    title="註冊Malta"
                                />
                            </div>
                        </div>
                    </span>

                </div>
            </nav>
            <div className="NavBarSpacer" />
        </div>
    );
}

