
function is(valueA: any): (value: any) => boolean {
  return function(valueB: any): boolean {
    return valueB === valueA;
  }
}
function isArray(filter: (data: any) => boolean): (value: any) => boolean {
  return function(value: any): boolean {
      if (!Array.isArray(value)) {
        return false;
      }
      return value.every(filter);
  }
}

function isstring(data: any): boolean {
    return typeof data === "string";
}
function isnumber(data: any): boolean {
    return typeof data === "number";
}
function isboolean(data: any): boolean {
    return typeof data === "boolean";
}
function isundefined(data: any): boolean {
    return typeof data === "undefined";
}
function isnull(data: any): boolean {
    return data === null;
}

function isBaseMeta(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isMaltaaAction(data.request))) {
        return false;
    }
        

    if (!(isstring(data.acid))) {
        return false;
    }
        

    if (!(isAuthToken(data.token) || isnull(data.token))) {
        return false;
    }
        

    if (!(isAccountId(data.account))) {
        return false;
    }
        

    if (!(isUserId(data.operator) || isnull(data.operator))) {
        return false;
    }
        

    if (!(data.doNotTrack === 0 || data.doNotTrack === 1 || isnull(data.doNotTrack))) {
        return false;
    }
        
    return true;
}
        
function isBaseAction(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    return true;
}
        
function isChangePathname(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "ChangePathname")) {
        return false;
    }
        

    if (!(isstring(data.pathname))) {
        return false;
    }
        
    return true;
}
        
function isProvideEntities(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "ProvideEntities")) {
        return false;
    }
        
    return true;
}
        
function isSetPodiumCursor(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "SetPodiumCursor")) {
        return false;
    }
        

    if (!(isArticleSort(data.sort))) {
        return false;
    }
        

    if (!(isnumber(data.period))) {
        return false;
    }
        

    if (!(isnumber(data.backtrack))) {
        return false;
    }
        
    return true;
}
        
function isLoadPodiumArticles(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "LoadPodiumArticles")) {
        return false;
    }
        

    if (!(isArticleSort(data.sort))) {
        return false;
    }
        

    if (!(isnumber(data.periodInDays))) {
        return false;
    }
        

    if (!(isnumber(data.backtrackInDays))) {
        return false;
    }
        

    if (!(isnumber(data.pageNumber))) {
        return false;
    }
        
    return true;
}
        
function isViewArticle(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "ViewArticle")) {
        return false;
    }
        

    if (!(isArticleId(data.article))) {
        return false;
    }
        
    return true;
}
        
function isViewUser(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "ViewUser")) {
        return false;
    }
        

    if (!(isstring(data.username))) {
        return false;
    }
        
    return true;
}
        
function isGoHome(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "GoHome")) {
        return false;
    }
        
    return true;
}
        
function isSearch(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "Search")) {
        return false;
    }
        

    if (!(isstring(data.keyword))) {
        return false;
    }
        
    return true;
}
        
function isStartAuthenticationDialog(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "StartAuthenticationDialog")) {
        return false;
    }
        
    return true;
}
        
function isStartPreferencesDialog(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "StartPreferencesDialog")) {
        return false;
    }
        
    return true;
}
        
function isStartMeDialog(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "StartMeDialog")) {
        return false;
    }
        
    return true;
}
        
function is__PartialPreferences(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isundefined(data.version) || isnumber(data.version))) {
        return false;
    }
        
    return true;
}
        
function isSetMyPreferences(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "SetMyPreferences")) {
        return false;
    }
        

    if (!(is__PartialPreferences(data.preferencesPatch))) {
        return false;
    }
        
    return true;
}
        
function isLoadedStoredPreferences(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "LoadedStoredPreferences")) {
        return false;
    }
        

    if (!(isPreferences(data.preferences))) {
        return false;
    }
        
    return true;
}
        
function isGenericError(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "GenericError")) {
        return false;
    }
        

    if (!(isstring(data.reason))) {
        return false;
    }
        
    return true;
}
        
function isGenericOk(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "GenericOk")) {
        return false;
    }
        
    return true;
}
        
function isCancelDialog(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "CancelDialog")) {
        return false;
    }
        
    return true;
}
        
function isRegister(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "Register")) {
        return false;
    }
        

    if (!(isstring(data.username))) {
        return false;
    }
        

    if (!(isstring(data.password))) {
        return false;
    }
        

    if (!(data.externalPlatform === "matters")) {
        return false;
    }
        

    if (!(isPreferences(data.preferences))) {
        return false;
    }
        
    return true;
}
        
function isSignin(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "Signin")) {
        return false;
    }
        

    if (!(isstring(data.username))) {
        return false;
    }
        

    if (!(isstring(data.password))) {
        return false;
    }
        
    return true;
}
        
function isSearchResultArticleRedirect(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "SearchResultArticleRedirect")) {
        return false;
    }
        

    if (!(isArticleId(data.id))) {
        return false;
    }
        
    return true;
}
        
function isGoToPage(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "GoToPage")) {
        return false;
    }
        

    if (!(isPageName(data.page))) {
        return false;
    }
        
    return true;
}
        
function isGetMyData(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "GetMyData")) {
        return false;
    }
        
    return true;
}
        
function isCreateAssortment(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "CreateAssortment")) {
        return false;
    }
        

    if (!(isstring(data.title))) {
        return false;
    }
        

    if (!(isstring(data.subpath))) {
        return false;
    }
        

    if (!(isArray(isAssortmentId)(data.upstreams))) {
        return false;
    }
        

    if (!(isAssortmentContentType(data.contentType))) {
        return false;
    }
        

    if (!(isArray(isAssortmentItem)(data.items))) {
        return false;
    }
        
    return true;
}
        
function isItemSpec(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.source === "matters")) {
        return false;
    }
        

    if (!(isMattersEntityType(data.entityType))) {
        return false;
    }
        

    if (!(isArticleId(data.id) || isUserId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.review))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentAddItem(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "AddItem")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isItemSpec(data.item))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentDropItem(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "DropItem")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isstring(data.itemId))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentOrderItems(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "OrderItems")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isArray(isstring)(data.items))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentEditReview(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "EditReview")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isstring(data.targetItemId))) {
        return false;
    }
        

    if (!(isstring(data.review))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentSetPolicy(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "SetPolicy")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isAssortmentPolicy(data.policy))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentEditTitle(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "EditTitle")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isstring(data.title))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentEditSubpath(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "EditSubpath")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isstring(data.subpath))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentEditUpstreams(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "EditUpstreams")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        

    if (!(isArray(isAssortmentId)(data.upstreams))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortmentSyncFromUpstreams(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "UpdateAssortment")) {
        return false;
    }
        

    if (!(data.operation === "SyncFromUpstreams")) {
        return false;
    }
        

    if (!(isAssortmentId(data.target))) {
        return false;
    }
        
    return true;
}
        
function isUpdateAssortment(data: any): boolean {
    return isUpdateAssortmentAddItem(data)
    ||isUpdateAssortmentDropItem(data)
    ||isUpdateAssortmentOrderItems(data)
    ||isUpdateAssortmentEditReview(data)
    ||isUpdateAssortmentSetPolicy(data)
    ||isUpdateAssortmentEditTitle(data)
    ||isUpdateAssortmentEditSubpath(data)
    ||isUpdateAssortmentEditUpstreams(data)
    ||isUpdateAssortmentSyncFromUpstreams(data)
}

function isSignout(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "Signout")) {
        return false;
    }
        
    return true;
}
        
function isViewAssortment(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "ViewAssortment")) {
        return false;
    }
        

    if (!(isAssortmentUIIdentifier(data.assortment) || isAssortmentId(data.assortment))) {
        return false;
    }
        
    return true;
}
        export 
function isMaltaaAction(data: any): boolean {
    return isChangePathname(data)
    ||isProvideEntities(data)
    ||isSetPodiumCursor(data)
    ||isViewArticle(data)
    ||isViewUser(data)
    ||isGoHome(data)
    ||isSearch(data)
    ||isStartAuthenticationDialog(data)
    ||isLoadPodiumArticles(data)
    ||isSetMyPreferences(data)
    ||isGenericError(data)
    ||isLoadedStoredPreferences(data)
    ||isCancelDialog(data)
    ||isStartPreferencesDialog(data)
    ||isRegister(data)
    ||isSearchResultArticleRedirect(data)
    ||isStartMeDialog(data)
    ||isGoToPage(data)
    ||isGetMyData(data)
    ||isCreateAssortment(data)
    ||isSignout(data)
    ||isGenericOk(data)
    ||isUpdateAssortment(data)
    ||isSignin(data)
    ||isViewAssortment(data)
}

function isArticleSort(data: any): boolean {
    return data === "comments" || data === "recent" || data === "appreciationAmount"
}

function isCommentSort(data: any): boolean {
    return data === "recent" || data === "old"
}

const isArticleId = isstring;

const isCommentId = isstring;

function isComment(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isCommentId(data.id))) {
        return false;
    }
        

    if (!(data.state === "active"
    ||data.state === "archived"
    ||data.state === "banned"
    ||data.state === "collapsed")) {
        return false;
    }
        

    if (!(isnumber(data.createdAt))) {
        return false;
    }
        

    if (!(isstring(data.content))) {
        return false;
    }
        

    if (!(isstring(data.author))) {
        return false;
    }
        

    if (!(isstring(data.parent))) {
        return false;
    }
        

    if (!(isstring(data.replyTarget) || isnull(data.replyTarget))) {
        return false;
    }
        
    return true;
}
        
function isArticle(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isArticleId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.mediaHash))) {
        return false;
    }
        

    if (!(isnumber(data.topicScore) || isnull(data.topicScore))) {
        return false;
    }
        

    if (!(isstring(data.slug))) {
        return false;
    }
        

    if (!(isnumber(data.createdAt))) {
        return false;
    }
        

    if (!(isstring(data.title))) {
        return false;
    }
        

    if (!(isstring(data.state))) {
        return false;
    }
        

    if (!(isboolean(data.public))) {
        return false;
    }
        

    if (!(isboolean(data.live))) {
        return false;
    }
        

    if (!(isstring(data.cover) || isnull(data.cover))) {
        return false;
    }
        

    if (!(isstring(data.summary))) {
        return false;
    }
        

    if (!(isUserId(data.author))) {
        return false;
    }
        

    if (!(isstring(data.dataHash))) {
        return false;
    }
        

    if (!(isboolean(data.sticky))) {
        return false;
    }
        

    if (!(isstring(data.content))) {
        return false;
    }
        

    if (!(isArray(isstring)(data.tags))) {
        return false;
    }
        

    if (!(isArray(isArticleId)(data.upstreams))) {
        return false;
    }
        

    if (!(isArray(isUserId)(data.subscribers))) {
        return false;
    }
        

    if (!(isstring(data.remark))) {
        return false;
    }
        

    if (!(isArray(isCommentId)(data.pinnedComments))) {
        return false;
    }
        
    return true;
}
        
function isLicense(data: any): boolean {
    return data === "UNLICENSED"
    ||data === "NOCLAIM"
    ||data === "CC BY-SA"
    ||data === "CC BY-ND"
    ||data === "CC BY-NC"
    ||data === "CC BY-NC-SA"
    ||data === "CC BY-NC-ND"
    ||data === "CC0"
}

function isArticleVersion(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isnumber(data.time))) {
        return false;
    }
        

    if (!(isstring(data.content))) {
        return false;
    }
        

    if (!(isstring(data.mediaHash))) {
        return false;
    }
        

    if (!(isUserId(data.editor))) {
        return false;
    }
        
    return true;
}
        
function isArticleSupplement(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isLicense(data.license))) {
        return false;
    }
        

    if (!(isRoomId(data.room) || isnull(data.room))) {
        return false;
    }
        

    if (!(isstring(data.canon) || isnull(data.canon))) {
        return false;
    }
        

    if (!(isArray(isUserId)(data.editors))) {
        return false;
    }
        

    if (!(isArray(isArticleVersion)(data.newVersions))) {
        return false;
    }
        
    return true;
}
        
const isUserId = isstring;

function isUserPublic(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isUserId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.uuid))) {
        return false;
    }
        

    if (!(isstring(data.userName))) {
        return false;
    }
        

    if (!(isstring(data.displayName))) {
        return false;
    }
        

    if (!(isstring(data.avatar))) {
        return false;
    }
        

    if (!(isArray(isUserId)(data.followees))) {
        return false;
    }
        
    return true;
}
        
const isRoomId = isstring;

function isRoomPolicy(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    return true;
}
        
function isRoom(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isRoomId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.description))) {
        return false;
    }
        

    if (!(isstring(data.mattersArticleBaseId) || isnull(data.mattersArticleBaseId))) {
        return false;
    }
        

    if (!(isboolean(data.global))) {
        return false;
    }
        

    if (!(isUserId(data.owner))) {
        return false;
    }
        

    if (!(isArray(isUserId)(data.admins))) {
        return false;
    }
        

    if (!(isstring(data.name))) {
        return false;
    }
        

    if (!(isRoomPolicy(data.policy))) {
        return false;
    }
        
    return true;
}
        
function isPaginationStatus(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isnumber(data.nextPage))) {
        return false;
    }
        

    if (!(isnumber(data.receivedItems))) {
        return false;
    }
        

    if (!(isboolean(data.loading))) {
        return false;
    }
        

    if (!(isboolean(data.exhausted))) {
        return false;
    }
        
    return true;
}
        
function isPodiumPageState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isArticleSort(data.sort))) {
        return false;
    }
        

    if (!(isnumber(data.period))) {
        return false;
    }
        

    if (!(isnumber(data.backtrack))) {
        return false;
    }
        

    if (!(isPaginationStatus(data.pagination))) {
        return false;
    }
        
    return true;
}
        
function isArticlePageState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isArticleId(data.id) || isnull(data.id))) {
        return false;
    }
        
    return true;
}
        
function isUserPageState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isstring(data.name) || isnull(data.name))) {
        return false;
    }
        
    return true;
}
        
function isPageName(data: any): boolean {
    return data === "podium"
    ||data === "study"
    ||data === "article"
    ||data === "user"
    ||data === "assortment"
}

function isStudyPageState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    return true;
}
        
function isAssortmentPageState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isAssortmentUIIdentifier(data.identifier) || isnull(data.identifier))) {
        return false;
    }
        
    return true;
}
        
function isPagesState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isPageName(data.current))) {
        return false;
    }
        

    if (!(isPodiumPageState(data.podium))) {
        return false;
    }
        

    if (!(isArticlePageState(data.article))) {
        return false;
    }
        

    if (!(isUserPageState(data.user))) {
        return false;
    }
        

    if (!(isStudyPageState(data.study))) {
        return false;
    }
        

    if (!(isAssortmentPageState(data.assortment))) {
        return false;
    }
        
    return true;
}
        
function isClientUIState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isPagesState(data.pages))) {
        return false;
    }
        

    if (!(data.dialog === "auth"
    ||data.dialog === "preferences"
    ||data.dialog === "me"
    ||isnull(data.dialog))) {
        return false;
    }
        
    return true;
}
        
function isAssortmentUIIdentifier(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isstring(data.ownerUsername))) {
        return false;
    }
        

    if (!(isAssortmentContentType(data.contentType))) {
        return false;
    }
        

    if (!(isstring(data.subpath))) {
        return false;
    }
        
    return true;
}
        
function isPathState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isstring(data.username))) {
        return false;
    }
        

    if (!(isstring(data.articleId))) {
        return false;
    }
        

    if (!(isAssortmentUIIdentifier(data.assortment))) {
        return false;
    }
        

    if (!(data.page === "study")) {
        return false;
    }
        
    return true;
}
        
function isMattersEntityType(data: any): boolean {
    return data === "article" || data === "user"
}

function isAssortmentBaseItem(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isstring(data.id))) {
        return false;
    }
        

    if (!(isUserId(data.collector))) {
        return false;
    }
        

    if (!(isnumber(data.collectionTime))) {
        return false;
    }
        

    if (!(isstring(data.review))) {
        return false;
    }
        

    if (!(isUserId(data.lastReviewer))) {
        return false;
    }
        

    if (!(isnumber(data.lastReviewTime))) {
        return false;
    }
        
    return true;
}
        
function isMattersEntityItem(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isArticleId(data.id) || isUserId(data.id))) {
        return false;
    }
        

    if (!(data.source === "matters")) {
        return false;
    }
        

    if (!(isMattersEntityType(data.entityType))) {
        return false;
    }
        
    return true;
}
        
const isAssortmentItem = isMattersEntityItem;

const isAssortmentId = isstring;

function isAssortmentContentType(data: any): boolean {
    return data === "anthology" || data === "roll" || data === "mixture"
}

function isAssortmentIdentifier(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isUserId(data.owner))) {
        return false;
    }
        

    if (!(isAssortmentContentType(data.contentType))) {
        return false;
    }
        

    if (!(isstring(data.subpath))) {
        return false;
    }
        
    return true;
}
        
function isAssortmentPolicy(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isboolean(data.archived))) {
        return false;
    }
        

    if (!(isboolean(data.allowForking))) {
        return false;
    }
        
    return true;
}
        
function isAssortment(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isAssortmentId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.title))) {
        return false;
    }
        

    if (!(isstring(data.subpath))) {
        return false;
    }
        

    if (!(isArticleId(data.mattersArticleBaseId) || isnull(data.mattersArticleBaseId))) {
        return false;
    }
        

    if (!(isstring(data.description))) {
        return false;
    }
        

    if (!(isUserId(data.owner))) {
        return false;
    }
        

    if (!(isArray(isUserId)(data.editors))) {
        return false;
    }
        

    if (!(isArray(isAssortmentId)(data.upstreams))) {
        return false;
    }
        

    if (!(isAssortmentContentType(data.contentType))) {
        return false;
    }
        

    if (!(isArray(isAssortmentItem)(data.items))) {
        return false;
    }
        

    if (!(isAssortmentPolicy(data.policy))) {
        return false;
    }
        
    return true;
}
        
function isClientState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isEntitiesState(data.entities))) {
        return false;
    }
        

    if (!(isClientUIState(data.ui))) {
        return false;
    }
        

    if (!(isPreferences(data.preferences))) {
        return false;
    }
        
    return true;
}
        
function isPreferences(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isnumber(data.version))) {
        return false;
    }
        
    return true;
}
        
function isLeveledCommentPreferences(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isCommentSort(data.sort))) {
        return false;
    }
        

    if (!(isnumber(data.displayThreshold))) {
        return false;
    }
        
    return true;
}
        
function isEntitiesState(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(true)) {
        return false;
    }
        

    if (!(true)) {
        return false;
    }
        

    if (!(true)) {
        return false;
    }
        

    if (!(true)) {
        return false;
    }
        

    if (!(isAccountSelf(data.me) || isnull(data.me))) {
        return false;
    }
        
    return true;
}
        
function isTokenRecord(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isstring(data.content))) {
        return false;
    }
        

    if (!(isnumber(data.expiration))) {
        return false;
    }
        
    return true;
}
        
function isRSAPublicKeyRecord(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "RSA")) {
        return false;
    }
        

    if (!(isstring(data.key))) {
        return false;
    }
        
    return true;
}
        
const isPublicKeyRecord = isRSAPublicKeyRecord;

function isPrivileges(data: any): boolean {
    return data === "admin" || data === "normal"
}

function isScryptRecord(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(data.type === "scrypt")) {
        return false;
    }
        

    if (!(isstring(data.hash))) {
        return false;
    }
        

    if (!(isnumber(data.keylen))) {
        return false;
    }
        

    if (!(isstring(data.salt))) {
        return false;
    }
        
    return true;
}
        
const isPasswordRecord = isScryptRecord;

const isAccountId = isstring;

function isMaltaaAccount(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isAccountId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.username))) {
        return false;
    }
        

    if (!(isArray(isPrivileges)(data.privileges))) {
        return false;
    }
        

    if (!(isPreferences(data.preferences))) {
        return false;
    }
        

    if (!(isPasswordRecord(data.password))) {
        return false;
    }
        

    if (!(isArray(isUserId)(data.mattersIds))) {
        return false;
    }
        

    if (!(isArray(isPublicKeyRecord)(data.publicKeys))) {
        return false;
    }
        
    return true;
}
        
function is__PickMaltaaAccount(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isAccountId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.username))) {
        return false;
    }
        

    if (!(isArray(isPrivileges)(data.privileges))) {
        return false;
    }
        

    if (!(isPreferences(data.preferences))) {
        return false;
    }
        

    if (!(isArray(isUserId)(data.mattersIds))) {
        return false;
    }
        
    return true;
}
        
const isAccountSelf = is__PickMaltaaAccount;

function isTokenInfo(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isstring(data.uuid))) {
        return false;
    }
        

    if (!(isnumber(data.iatS))) {
        return false;
    }
        

    if (!(isnumber(data.expS))) {
        return false;
    }
        
    return true;
}
        
const isTagId = isstring;

function isTag(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isTagId(data.id))) {
        return false;
    }
        

    if (!(isstring(data.content))) {
        return false;
    }
        

    if (!(isnumber(data.createdAt))) {
        return false;
    }
        

    if (!(isstring(data.cover))) {
        return false;
    }
        

    if (!(isstring(data.description) || isnull(data.description))) {
        return false;
    }
        
    return true;
}
        
const isAuthTokenId = isstring;

function isAuthToken(data: any): boolean {
    if (typeof data !== "object") {
        return false;
    }
    if (!data) {
        return false;
    }
                
    if (!(isAuthTokenId(data.id))) {
        return false;
    }
        

    if (!(isAccountId(data.holder))) {
        return false;
    }
        

    if (!(isstring(data.secret))) {
        return false;
    }
        

    if (!(isboolean(data.valid))) {
        return false;
    }
        

    if (!(isnumber(data.created))) {
        return false;
    }
        
    return true;
}
        