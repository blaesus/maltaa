import { MaltaaAction, ProvideEntities } from "../../../definitions/Actions";
import { ArticleSort } from "../../../sorts";
import { AssortmentUIIdentifier, parsePathName } from "../uiUtils";
import { ArticleId } from "../../../definitions/Article";
import { Preferences } from "../../../definitions/Preferences";

export interface PaginationStatus {
    nextPage: number,
    receivedItems: number,
    loading: boolean,
    exhausted: boolean,
}

export function getEmptyPaginationStatus(): PaginationStatus {
    return {
        nextPage: 0,
        receivedItems: 0,
        loading: false,
        exhausted: false,
    }
}

export interface PodiumPageState {
    sort: ArticleSort,
    period: number,
    backtrack: number,
    pagination: PaginationStatus
}

export interface ArticlePageState {
    id: ArticleId | null,
}

export interface UserPageState {
    name: string | null,
}

export type PageName =
    "podium"
    | "study"
    | "article"
    | "user"
    | "assortment"

export interface StudyPageState {

}

export interface AssortmentPageState {
    identifier: AssortmentUIIdentifier | null,
}

export interface PagesState {
    current: PageName,
    podium: PodiumPageState,
    article: ArticlePageState,
    user: UserPageState,
    study: StudyPageState,
    assortment: AssortmentPageState,
}

export interface ClientUIState {
    pages: PagesState,
    dialog: "auth" | "preferences" | "me" | null,
}

export function getInitialUIState(preferences?: Preferences): ClientUIState {
    return {
        pages: {
            current: "podium",
            podium: {
                sort: preferences?.podium?.defaultSort || "recent",
                period: preferences?.podium?.defaultPeriod || 7,
                backtrack: 0,
                pagination: getEmptyPaginationStatus(),
            },
            article: {
                id: null,
            },
            user: {
                name: "",
            },
            study: {},
            assortment: {
                identifier: null,
            },
        },
        dialog: null,
    };
}


function handleProvideEntities(
    ui: ClientUIState,
    response: ProvideEntities,
    request: MaltaaAction,
): ClientUIState {
    const nextUi = {...ui};
    switch (request.type) {
        case "LoadPodiumArticles": {
            const pageExpected = ui.pages.podium.pagination.nextPage === request.pageNumber;
            if (pageExpected) {
                const articleCount = response.data?.articles ? response.data?.articles.length : 0;
                nextUi.pages = {
                    ...ui.pages,
                    podium: {
                        ...ui.pages.podium,
                        pagination: {
                            loading: false,
                            exhausted: articleCount === 0,
                            nextPage: ui.pages.podium.pagination.nextPage + 1,
                            receivedItems: ui.pages.podium.pagination.receivedItems + articleCount
                        }
                    }
                };
            }
            return nextUi;
        }
        case "Register": {
            if (ui.dialog === "auth") {
                return {
                    ...ui,
                    dialog: null,
                }
            } else {
                return ui;
            }
        }
        default: {
            return ui;
        }
    }


}

export function uiReducer(ui: ClientUIState, action: MaltaaAction): ClientUIState {
    switch (action.type) {
        case "GoHome": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    current: "podium",
                },
                dialog: null,
            }
        }
        case "ChangePathname": {
            const pathState = parsePathName(action.pathname);
            if (pathState.articleId) {
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        current: "article",
                        article: {
                            id: pathState.articleId
                        }
                    }
                }
            } else if (pathState.username) {
                if (pathState.assortment) {
                    return {
                        ...ui,
                        pages: {
                            ...ui.pages,
                            current: "assortment",
                            assortment: {
                                identifier: pathState.assortment
                            },
                        }
                    }
                }
                else {
                    return {
                        ...ui,
                        pages: {
                            ...ui.pages,
                            current: "user",
                            user: {
                                name: pathState.username
                            }
                        }
                    }
                }
            }
            else if (pathState.page === "study") {
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        current: "study",
                    }
                }
            } else {
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        current: "podium",
                    }
                }
            }
        }
        case "ViewArticle": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    current: "article",
                    article: {
                        id: action.article,
                    },
                }
            }
        }
        case "ViewUser": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    current: "user",
                    user: {
                        name: action.username,
                    },
                }
            };
        }
        case "ProvideEntities": {
            const request = action.meta?.request;
            if (request) {
                return handleProvideEntities(ui, action, request);
            }
            return ui;
        }
        case "LoadPodiumArticles": {
            const page = ui.pages;
            if (page.current !== "podium") {
                return ui;
            }
            const nextPage = {...page};
            nextPage.podium.pagination.loading = true;
            return {
                ...ui,
                pages: nextPage,
            };
        }
        case "StartAuthenticationDialog": {
            return {
                ...ui,
                dialog: "auth",
            }
        }
        case "StartPreferencesDialog": {
            return {
                ...ui,
                dialog: "preferences",
            }
        }
        case "CancelDialog": {
            return {
                ...ui,
                dialog: null,
            }
        }
        case "SearchResultArticleRedirect": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    current: "article",
                    article: {
                        id: action.id
                    },
                }
            }
        }
        case "SetPodiumCursor": {
            const pages = ui.pages;
            if (pages.current === "podium") {
                const isCursorChanged =
                    action.sort !== pages.podium.sort
                    || action.period !== pages.podium.period
                    || action.backtrack !== pages.podium.backtrack;
                let nextPagination = ui.pages.podium.pagination;
                if (isCursorChanged) {
                    nextPagination = getEmptyPaginationStatus();
                }
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        podium: {
                            ...ui.pages.podium,
                            sort: action.sort,
                            period: action.period,
                            backtrack: action.backtrack || 0,
                            pagination: nextPagination,
                        },
                    },
                };
            } else {
                return ui;
            }
        }
        case "GoToPage": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    current: action.page,
                }
            }
        }
        case "StartMeDialog": {
            return {
                ...ui,
                dialog: "me",
            }
        }
        case "Signout": {
            return getInitialUIState();
        }

        default: {
            return ui;
        }
    }
}

