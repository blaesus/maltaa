import { ArticleSort } from "../sorts";
import {Article, ArticleId, UserId, UserPublic, Comment, Preferences, AccountSelf, AccountId} from "./data-types";
import {PageName} from "../client/web/states/uiReducer";
import {AuthToken} from "./authToken";
import {Assortment, AssortmentId, AssortmentItem, MattersEntityType} from "./assortment";

export interface BaseAction {
    meta?: {
        request?: MaltaaAction,
        // Action client ID, for servers to deduplicate.
        acid?: string,

        token?: AuthToken

        account?: AccountId,
    },
}

export interface ChangePathname extends BaseAction {
    type: "ChangePathname",
    pathname: string,
}

export interface ProvideEntities extends BaseAction {
    type: "ProvideEntities",
    data: {
        articles?: Article[],
        users?: UserPublic[],
        comments?: Comment[],
        assortments?: Assortment[],
        me?: AccountSelf,
    }
}

export interface SetPodiumCursor extends BaseAction {
    type: "SetPodiumCursor",
    sort: ArticleSort,
    period: number,
    backtrack?: number,
}

export interface LoadPodiumArticles extends BaseAction {
    type: "LoadPodiumArticles",
    sort: ArticleSort,
    periodInDays: number,
    backtrackInDays?: number,
    pageNumber: number,
}

export interface ViewArticle extends BaseAction {
    type: "ViewArticle",
    article: ArticleId,
}

export interface ViewUser extends BaseAction {
    type: "ViewUser",
    username: string,
}

export interface GoHome extends BaseAction {
    type: "GoHome",
}

export interface Search extends BaseAction {
    type: "Search",
    keyword: string,
}

export interface StartAuthenticationDialog extends BaseAction {
    type: "StartAuthenticationDialog",
}

export interface StartPreferencesDialog extends BaseAction {
    type: "StartPreferencesDialog",
}

export interface StartMeDialog extends BaseAction {
    type: "StartMeDialog",
}

export interface SetMyPreferences extends BaseAction {
    type: "SetMyPreferences",
    preferencesPatch: Partial<Preferences>,
}

export interface LoadedStoredPreferences extends BaseAction {
    type: "LoadedStoredPreferences",
    preferences: Preferences,
}

export interface GenericError extends BaseAction {
    type: "GenericError"
    reason: string,
}

export interface CancelDialog extends BaseAction {
    type: "CancelDialog"
}

export interface Register extends BaseAction {
    type: "Register",
    username: string,
    password: string,
    externalPlatform?: "matters"
    preferences?: Preferences,
}

export interface SearchResultArticleRedirect extends BaseAction {
    type: "SearchResultArticleRedirect",
    id: ArticleId,
}

export interface GoToPage extends BaseAction {
    type: "GoToPage",
    page: PageName,
}

export interface GetMe extends BaseAction {
    type: "GetMe",
}

export interface CreateAssortment extends BaseAction {
    type: "CreateAssortment"
    title: string,
    upstreams: AssortmentId[],
    limitContentType: MattersEntityType | null,
    articles: AssortmentItem[],
}

export type MaltaaAction =
    ChangePathname
    | ProvideEntities
    | SetPodiumCursor
    | ViewArticle
    | ViewUser
    | GoHome
    | Search
    | StartAuthenticationDialog
    | LoadPodiumArticles
    | SetMyPreferences
    | GenericError
    | LoadedStoredPreferences
    | CancelDialog
    | StartPreferencesDialog
    | Register
    | SearchResultArticleRedirect
    | StartMeDialog
    | GoToPage
    | GetMe
    | CreateAssortment
;


