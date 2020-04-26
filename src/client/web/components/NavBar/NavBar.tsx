import * as React from "react";
import "./NavBar.css";
import { MaltaaDispatch } from "../../uiUtils";
import { ClientState } from "../../states/reducer";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { deprefixUserName, isArticleId, isFullUserName } from "../../../../mattersSpecifics";
import { isThreadSubpath, threadSubpathToMattersArticleId } from "../../../../maltaaSpecifics";

function MenuItem(props: {
    title: string,
    onClick(): void,
}) {
    return (
        <AnchorButton onClick={props.onClick}>
            {props.title}
        </AnchorButton>
    );
}

export function NavBar(props: {
    state: ClientState,
    dispatch: MaltaaDispatch,
}) {
    const {dispatch, state} = props;
    const [input, setInput] = React.useState("");
    const [extendMain, setExtendMain] = React.useState(false);

    const hasAccount = !!state.entities.me;

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
                                    if (isArticleId(input, atob)) {
                                        dispatch({
                                            type: "ViewArticle",
                                            article: input,
                                        });
                                    }
                                    else if (isThreadSubpath(input)) {
                                        const id = threadSubpathToMattersArticleId(input, btoa);
                                        dispatch({
                                            type: "ViewArticle",
                                            article: id,
                                        });
                                    }
                                    else if (isFullUserName(input)) {
                                        dispatch({
                                            type: "ViewUser",
                                            username: deprefixUserName(input),
                                        });
                                    }
                                    else {
                                        dispatch({type: "Search", keyword: input});
                                    }
                                    setInput("");
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
                                {
                                    !hasAccount &&
                                    <MenuItem
                                        onClick={() => dispatch({type: "StartAuthenticationDialog"})}
                                        title="註冊Malta"
                                    />
                                }
                                {
                                    hasAccount &&
                                    <MenuItem
                                        onClick={() => dispatch({type: "StartMeDialog"})}
                                        title="我的帳戶"
                                    />
                                }

                            </div>
                        </div>
                    </span>

                </div>
            </nav>
            <div className="NavBarSpacer"/>
        </div>
    );
}

