import { ArticleSort, CommentSort } from "../sorts";
import { AuthToken } from "./AuthToken";
import {
    Assortment,
    AssortmentContentType,
    AssortmentId,
    AssortmentItem,
    AssortmentPolicy,
    MattersEntityType,
} from "./Assortment";
import { AccountId, AccountSelf } from "./MaltaaAccount";
import { Article, ArticleId, Comment } from "./Article";
import { UserId, UserPublic } from "./User";
import { Preferences } from "./Preferences";
import { AssortmentUIIdentifier, PageName, UserPageTab } from "./UI";

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

export interface SetArticleCursor extends BaseAction {
    type: "SetArticleCursor",
    mode: "podium" | "user"
    sort: ArticleSort,
    period: number,
    backtrack?: number,
}

export interface LoadArticles extends BaseAction {
    type: "LoadArticles",
    sort: ArticleSort,
    periodInDays: number,
    backtrackInDays?: number,
    pageNumber: number,
    author?: UserId | null,
}

export interface LoadComments extends BaseAction {
    type: "LoadComments",
    sort: CommentSort,
    pageNumber: number,
    author: UserId,
}

export interface ViewArticle extends BaseAction {
    type: "ViewArticle",
    article: ArticleId,
}

export interface ViewUser extends BaseAction {
    type: "ViewUser",
    username: string,
    tab?: UserPageTab,
}

export interface SetUserCommentCursor extends BaseAction {
    type: "SetUserCommentCursor",
    sort: CommentSort,
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
    type: "SearchResult"
    subtype: "ArticleRedirect",
    id: ArticleId,
}

export type SearchResult = SearchResultArticleRedirect

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

interface ItemSpec {
    source: "matters",
    entityType: MattersEntityType,
    id: ArticleId | UserId,
    review: string,
}

export interface UpdateAssortmentAddItem extends BaseAction {
    type: "UpdateAssortment",
    operation: "AddItem",
    target: AssortmentId,
    item: ItemSpec,
}

export interface UpdateAssortmentDropItem extends BaseAction {
    type: "UpdateAssortment",
    operation: "DropItem",
    target: AssortmentId,
    itemId: string,
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

export interface UpdateAssortmentSetPolicy extends BaseAction {
    type: "UpdateAssortment",
    operation: "SetPolicy",
    target: AssortmentId,
    policy: AssortmentPolicy,
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

export interface UpdateAssortmentEditUpstreams extends BaseAction {
    type: "UpdateAssortment",
    operation: "EditUpstreams",
    target: AssortmentId,
    upstreams: AssortmentId[],
}

export interface UpdateAssortmentSyncFromUpstreams extends BaseAction {
    type: "UpdateAssortment",
    operation: "SyncFromUpstreams",
    target: AssortmentId,
}

export type UpdateAssortment =
    UpdateAssortmentAddItem
    | UpdateAssortmentDropItem
    | UpdateAssortmentOrderItems
    | UpdateAssortmentEditReview
    | UpdateAssortmentSetPolicy
    | UpdateAssortmentEditTitle
    | UpdateAssortmentEditSubpath
    | UpdateAssortmentEditUpstreams
    | UpdateAssortmentSyncFromUpstreams
    ;

export interface Signout extends BaseAction {
    type: "Signout",
}

export interface ViewAssortment extends BaseAction {
    type: "ViewAssortment",
    assortment: AssortmentUIIdentifier | AssortmentId,
}

export type ClientRequest =
    LoadArticles
    | ViewUser
    | ViewArticle
    | Register
    | Search
    | GetMyData
    | CreateAssortment
    | UpdateAssortment
    | ViewAssortment
    | Signin
    | Signout
    | SetMyPreferences
    | LoadComments
    ;

export type MaltaaAction =
    ClientRequest
    | ChangePathname
    | ProvideEntities
    | SetArticleCursor
    | GoHome
    | StartAuthenticationDialog
    | GenericError
    | LoadedStoredPreferences
    | CancelDialog
    | StartPreferencesDialog
    | SearchResult
    | StartMeDialog
    | GoToPage
    | SetUserCommentCursor
    | GenericOk
    ;
