import * as React from "react";
import { useCallback, useEffect, useReducer } from "react";
import * as ReactDom from "react-dom";

import { StateInspector, useReducer as useReducerInspected } from "reinspect"

import "./normalize.css"
import "./WebRoot.css"

import { PageName } from "./states/uiReducer";
import { MaltaaAction } from "../../definitions/actions";
import { ClientState, getInitialClientState, reducer } from "./states/reducer";

import { ArticlePage } from "./components/ArticlePage/ArticlePage";
import { NavBar } from "./components/NavBar/NavBar";
import { UserPage } from "./components/UserPage/UserPage";
import { Podium } from "./components/Podium/Podium";
import { Dialogs } from "./components/Dialogs/Dialogs";
import { Chooser } from "./components/Chooser/Chooser";
import { ExplorePage } from "./components/ExplorePage/ExplorePage";
import { AssortmentPage } from "./components/AssortmentPage/AssortmentPage";

import { maltaaApi } from "./maltaaApiClient";
import { USER_URL_SIGIL } from "../../settings";
import { loadStoredPreference, MaltaaDispatch, OptionList, serializeToPathName, storePreference } from "./uiUtils";

const remoteActions: MaltaaAction["type"][] = [
    "LoadPodiumArticles",
    "ViewUser",
    "ViewArticle",
    "Register",
    "Search",
    "GetMyData",
    "CreateAssortment",
    "UpdateAssortment",
    "ViewAssortment",
];

const pageOptions: OptionList<PageName> = [
    {
        value: "podium",
        label: "廣場",
    },
    {
        value: "explore",
        label: "發現",
    },
]


const DEV = location.hostname === "localhost";

function WebRoot(props: {
    initialState: ClientState,
}) {
    const {initialState} = props;
    let [state, localDispatch] = useReducer(reducer, initialState);
    if (DEV) {
        [state, localDispatch] = useReducerInspected(reducer, undefined, () => initialState, "ROOT");
    }
    const {entities, ui, preferences} = state;

    function dispatchWithRemote(action: MaltaaAction) {
        localDispatch(action);
        if (remoteActions.includes(action.type)) {
            maltaaApi.action(action)
                .then(answer => localDispatch(answer));
        }
    }

    const dispatch: MaltaaDispatch = useCallback((action) => dispatchWithRemote(action), [localDispatch]);

    useEffect(() => {
        const preferences = loadStoredPreference();
        if (preferences) {
            dispatch({
                type: "LoadedStoredPreferences",
                preferences,
            })
        }
    }, []);

    useEffect(() => {
        dispatch({
            type: "GetMyData",
        })
    }, []);

    useEffect(() => storePreference(preferences), [preferences]);

    function updateUIStateForPathName() {
        dispatch({
            type: "ChangePathname",
            pathname: window.location.pathname,
        });
    }

    {
        useEffect(() => {
            updateUIStateForPathName();
            window.addEventListener("popstate", (event) => {
                event.preventDefault();
                updateUIStateForPathName()
            });
        }, []);

        useEffect(() => {
            const timer = window.setTimeout(() => {
                const nextPath = serializeToPathName(ui) || "/";
                if (location.pathname !== nextPath) {
                    history.pushState(ui, "", nextPath);
                }
            });
            return () => clearTimeout(timer);
        }, [ui.pages]);
    }

    const userInView = ui.pages.user.name;
    useEffect(() => {
        if (userInView) {
            dispatch({type: "ViewUser", username: userInView});
        }
    }, [userInView]);
    const page = ui.pages;

    function calcDocumentTitle(page: PageName): string {
        switch (page) {
            case "podium": {
                return `Maltaa|廣場`;
            }
            case "article": {
                if (state.ui.pages.article.id) {
                    const article = state.entities.articles[state.ui.pages.article.id];
                    if (article) {
                        return `Maltaa|${article.title}`
                    }
                }
                return `Maltaa`;
            }
            case "user": {
                if (state.ui.pages.user.name) {
                    const user = Object.values(state.entities.users).find(u => u.userName === state.ui.pages.user.name);
                    if (user) {
                        return `Maltaa|${USER_URL_SIGIL}${user.userName}`;
                    }
                }
                return `Maltaa`
            }
            default: {
                return `Maltaa`
            }
        }
    }

    useEffect(() => {
        document.title = calcDocumentTitle(page.current);
    }, [state.ui.pages]);

    useEffect(() => {
        const id = "CUSTOM"
        const existing = document.getElementById(id);
        if (existing) {
            existing.innerHTML = preferences.styles.customCSS;
        } else {
            const styleDom = document.createElement("style");
            styleDom.id = id;
            styleDom.innerHTML = preferences.styles.customCSS;
            document.head.appendChild(styleDom);
        }
    }, [preferences.styles.customCSS])

    return (
        <div>
            <NavBar
                state={state}
                dispatch={dispatch}
            />
            <div>
                <Chooser
                    options={pageOptions}
                    chosen={state.ui.pages.current}
                    onChoose={page => {
                        dispatch({
                            type: "GoToPage",
                            page,
                        })
                    }}
                />
            </div>
            <Podium
                page={page.podium}
                state={state}
                dispatch={dispatch}
            />
            <ExplorePage state={state} dispatch={dispatch}/>
            <ArticlePage articleId={page.article.id} dispatch={dispatch} state={state}/>
            <AssortmentPage state={state} dispatch={dispatch}/>
            {
                page.current === "user" &&
                <UserPage
                    user={Object.values(entities.users).find(user => user.userName === page.user.name)}
                    screenedUsers={preferences.data.screenedUsers}
                    onToggleScreen={userId => {
                        const currentlyScreened = state.preferences.data.screenedUsers.includes(userId);
                        dispatch({
                            type: "SetMyPreferences", preferencesPatch: {
                                data: {
                                    ...preferences.data,
                                    screenedUsers:
                                        currentlyScreened
                                            ? state.preferences.data.screenedUsers.filter(u => u !== userId)
                                            : [...state.preferences.data.screenedUsers, userId]
                                }
                            }
                        })
                    }}
                />
            }
            <Dialogs
                dialogState={ui.dialog}
                dispatch={dispatch}
                state={state}
            />
        </div>
    )
}

const INITIAL_CLIENT_STATE = getInitialClientState(loadStoredPreference());

const InspectedRoot = () => (
    <StateInspector initialState={{ROOT: INITIAL_CLIENT_STATE}}>
        <WebRoot initialState={INITIAL_CLIENT_STATE}/>
    </StateInspector>
);

const RootElement = DEV ? <InspectedRoot/> : <WebRoot initialState={INITIAL_CLIENT_STATE}/>

ReactDom.render(RootElement, document.getElementById("REACT-ROOT"));
