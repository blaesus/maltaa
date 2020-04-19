import { ArticleSort } from "../sorts";
import { PageName } from "../client/web/states/uiReducer";
import { AuthToken } from "./AuthToken";
import { Assortment, AssortmentContentType, AssortmentId, AssortmentItem, MattersEntityType } from "./Assortment";
import { AssortmentUIIdentifier } from "../client/web/uiUtils";
import { AccountId, AccountSelf } from "./MaltaaAccount";
import { Article, ArticleId, Comment } from "./Article";
import { UserId, UserPublic } from "./User";
import { Preferences } from "./Preferences";

export interface BaseMeta {

    request?: MaltaaAction,

    // Action client ID, for servers to deduplicate.
    acid?: string,

    // Assigned by server to be transformed into cookie
    token?: AuthToken | null

    // Assigned by server authenticator
    account?: AccountId,

    // Specified by client to claim which Matters User as operator
    operator?: UserId | null,

    // Specified by client
    doNotTrack?: 0 | 1 | null,
}

export interface BaseAction<ExtraMeta = {}> {
    meta?: BaseMeta & ExtraMeta,
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

export interface GenericOk extends BaseAction {
    type: "GenericOk"
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

export interface Signin extends BaseAction {
    type: "Signin",
    username: string,
    password: string,
}

export interface SearchResultArticleRedirect extends BaseAction {
    type: "SearchResultArticleRedirect",
    id: ArticleId,
}

export interface GoToPage extends BaseAction {
    type: "GoToPage",
    page: PageName,
}

export interface GetMyData extends BaseAction {
    type: "GetMyData",
}

export interface CreateAssortment extends BaseAction {
    type: "CreateAssortment"
    title: string,
    subpath: string,
    upstreams: AssortmentId[],
    contentType: AssortmentContentType,
    items: AssortmentItem[],
}

type ItemSpec = {
    source: "matters",
    entityType: MattersEntityType,
    id: ArticleId | UserId,
    note: string,
}

export interface UpdateAssortmentAddItem extends BaseAction {
    type: "UpdateAssortment",
    operation: "AddItem",
    target: AssortmentId,
    item: ItemSpec,
}

export interface UpdateAssortmentOrderItems extends BaseAction {
    type: "UpdateAssortment",
    operation: "OrderItems",
    target: AssortmentId,
    items: string[],
}

export interface UpdateAssortmentEditReview extends BaseAction {
    type: "UpdateAssortment",
    operation: "EditReview",
    target: AssortmentId,
    targetItemId: string,
    review: string,
}

export interface UpdateAssortmentArchive extends BaseAction {
    type: "UpdateAssortment",
    operation: "Archive",
    target: AssortmentId,
    archived: boolean
}

export interface UpdateAssortmentEditTitle extends BaseAction {
    type: "UpdateAssortment",
    operation: "EditTitle",
    target: AssortmentId,
    title: string,
}

export interface UpdateAssortmentEditSubpath extends BaseAction {
    type: "UpdateAssortment",
    operation: "EditSubpath",
    target: AssortmentId,
    subpath: string,
}

export type UpdateAssortment =
    UpdateAssortmentAddItem
    | UpdateAssortmentOrderItems
    | UpdateAssortmentEditReview
    | UpdateAssortmentArchive
    | UpdateAssortmentEditTitle
    | UpdateAssortmentEditSubpath
;

export interface Signout extends BaseAction {
    type: "Signout",
}

export interface ViewAssortment extends BaseAction {
    type: "ViewAssortment",
    assortment: AssortmentUIIdentifier | AssortmentId,
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
    | GetMyData
    | CreateAssortment
    | Signout
    | GenericOk
    | UpdateAssortment
    | Signin
    | ViewAssortment
    ;


