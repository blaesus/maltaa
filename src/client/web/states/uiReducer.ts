import { MaltaaAction, ProvideEntities } from "../../../definitions/Actions";
import { ArticleSort, CommentSort } from "../../../sorts";
import { parsePathName } from "../uiUtils";
import { ArticleId } from "../../../definitions/Article";
import { Preferences } from "../../../definitions/Preferences";
import { INFINITY_JSON } from "../../../utils";
import { AssortmentUIIdentifier, PageName, UserPageTab } from "../../../definitions/UI";
import { defaultUserTab } from "../../uiSettings";

const fallbackArticleSort: ArticleSort = "recent";
const fallbackCommentSort: CommentSort = "recent";

export interface PaginationStatus {
    nextPage: number,
    receivedItems: ArticleId[],
    loading: boolean,
    exhausted: boolean,
}

export function getEmptyPaginationStatus(): PaginationStatus {
    return {
        nextPage: 0,
        receivedItems: [],
        loading: false,
        exhausted: false,
    };
}

export interface ListSetting<Sort> {
    sort: Sort,
    period: number,
    backtrack: number,
    pagination: PaginationStatus
}

export type ArticleListSetting = ListSetting<ArticleSort>;

export function getEmptyListState<T>(sort: T): ListSetting<T> {
    return {
        sort,
        period: INFINITY_JSON,
        backtrack: 0,
        pagination: getEmptyPaginationStatus(),
    };
}

export interface PodiumPageState extends ArticleListSetting {
}

export interface ArticlePageState {
    id: ArticleId | null,
}

export interface UserPageState {
    name: string | null,
    tab: UserPageTab,
    articles: ArticleListSetting,
    comments: ListSetting<CommentSort>,
}

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
                tab: defaultUserTab,
                articles: getEmptyListState("recent"),
                comments: getEmptyListState("recent"),
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
        case "LoadArticles": {
            if (request.author) {
                const pageExpected = ui.pages.user.articles.pagination.nextPage === request.pageNumber;
                if (pageExpected) {
                    const newArticles = response.data?.articles || [];
                    nextUi.pages = {
                        ...ui.pages,
                        user: {
                            ...ui.pages.user,
                            articles: {
                                ...ui.pages.user.articles,
                                pagination: {
                                    ...ui.pages.user.articles.pagination,
                                    loading: false,
                                    exhausted: !newArticles.length,
                                    nextPage: ui.pages.user.articles.pagination.nextPage + 1,
                                    receivedItems: [
                                        ...ui.pages.user.articles.pagination.receivedItems,
                                        ...(newArticles.map(a => a.id)),
                                    ],
                                },
                            },
                        },
                    };
                }
            }
            else {
                const pageExpected = ui.pages.podium.pagination.nextPage === request.pageNumber;
                if (pageExpected) {
                    const newArticles = response.data?.articles || [];
                    nextUi.pages = {
                        ...ui.pages,
                        podium: {
                            ...ui.pages.podium,
                            pagination: {
                                loading: false,
                                exhausted: !newArticles.length,
                                nextPage: ui.pages.podium.pagination.nextPage + 1,
                                receivedItems: [
                                    ...ui.pages.podium.pagination.receivedItems,
                                    ...(newArticles.map(a => a.id)),
                                ],
                            },
                        },
                    };
                }
            }
            return nextUi;
        }
        case "Register": {
            if (ui.dialog === "auth") {
                return {
                    ...ui,
                    dialog: null,
                };
            }
            else {
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
            };
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
                            id: pathState.articleId,
                        },
                    },
                };
            }
            else if (pathState.username) {
                if (pathState.assortment) {
                    return {
                        ...ui,
                        pages: {
                            ...ui.pages,
                            current: "assortment",
                            assortment: {
                                identifier: pathState.assortment,
                            },
                        },
                    };
                }
                else {
                    return {
                        ...ui,
                        pages: {
                            ...ui.pages,
                            current: "user",
                            user: {
                                ...ui.pages.user,
                                name: pathState.username,
                                articles: getEmptyListState(fallbackArticleSort),
                            },
                        },
                    };
                }
            }
            else if (pathState.page === "study") {
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        current: "study",
                    },
                };
            }
            else {
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        current: "podium",
                    },
                };
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
                },
            };
        }
        case "ViewUser": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    current: "user",
                    user: {
                        ...ui.pages.user,
                        name: action.username,
                        articles: getEmptyListState(fallbackArticleSort),
                        tab: action.tab || ui.pages.user.tab,
                    },
                },
            };
        }
        case "ProvideEntities": {
            const request = action.meta?.request;

            if (request) {
                return handleProvideEntities(ui, action, request);
            }
            return ui;
        }
        case "LoadArticles": {
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
            };
        }
        case "StartPreferencesDialog": {
            return {
                ...ui,
                dialog: "preferences",
            };
        }
        case "CancelDialog": {
            return {
                ...ui,
                dialog: null,
            };
        }
        case "SearchResult": {
            switch (action.subtype) {
                case "ArticleRedirect": {
                    return {
                        ...ui,
                        pages: {
                            ...ui.pages,
                            current: "article",
                            article: {
                                id: action.id,
                            },
                        },
                    };
                }
                default: {
                    return ui;
                }
            }
        }
        case "SetArticleCursor": {
            const pages = ui.pages;
            let setting: ArticleListSetting;
            if (action.mode === "podium") {
                setting = pages.podium;
            }
            else {
                setting = pages.user.articles;
            }
            const isCursorChanged =
                action.sort !== setting.sort
                || action.period !== setting.period
                || action.backtrack !== setting.backtrack;
            let nextPagination = setting.pagination;
            if (isCursorChanged) {
                nextPagination = getEmptyPaginationStatus();
            }
            const nextSetting = {
                ...setting,
                sort: action.sort,
                period: action.period,
                backtrack: action.backtrack || 0,
                pagination: nextPagination,
            };
            if (action.mode === "podium") {
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        podium: nextSetting,
                    },
                };
            }
            else {
                return {
                    ...ui,
                    pages: {
                        ...ui.pages,
                        user: {
                            ...ui.pages.user,
                            articles: nextSetting,
                        },
                    },
                };
            }

        }
        case "GoToPage": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    current: action.page,
                },
            };
        }
        case "StartMeDialog": {
            return {
                ...ui,
                dialog: "me",
            };
        }
        case "Signout": {
            return getInitialUIState();
        }

        default: {
            return ui;
        }
    }
}

