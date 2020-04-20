
function is(valueA: any): any {
  return function(valueB: any): boolean {
    return valueB === valueA;
  }
}

export function isstring(data: any): boolean {
    return typeof data === "string";
}
export function isnumber(data: any): boolean {
    return typeof data === "number";
}

export function isPreferences(data: any): boolean {
  
              if (!isnumber(data.version)) {
                return false;
              }
              
  return true;
}
        
export function isLeveledCommentPreferences(data: any): boolean {
  
              if (!isCommentSort(data.sort)) {
                return false;
              }
              

              if (!isnumber(data.displayThreshold)) {
                return false;
              }
              
  return true;
}
        export const isUserId = isstring;
export function isUserPublic(data: any): boolean {
  
              if (!isUserId(data.id)) {
                return false;
              }
              

              if (!isstring(data.uuid)) {
                return false;
              }
              

              if (!isstring(data.userName)) {
                return false;
              }
              

              if (!isstring(data.displayName)) {
                return false;
              }
              

              if (!isstring(data.avatar)) {
                return false;
              }
              
  return true;
}
        export const isArticleId = isstring;export const isCommentId = isstring;
export function isComment(data: any): boolean {
  
              if (!isCommentId(data.id)) {
                return false;
              }
              

              if (!isnumber(data.createdAt)) {
                return false;
              }
              

              if (!isstring(data.content)) {
                return false;
              }
              

              if (!isstring(data.author)) {
                return false;
              }
              

              if (!isstring(data.parent)) {
                return false;
              }
              
  return true;
}
        
export function isArticle(data: any): boolean {
  
              if (!isArticleId(data.id)) {
                return false;
              }
              

              if (!isstring(data.mediaHash)) {
                return false;
              }
              

              if (!isstring(data.slug)) {
                return false;
              }
              

              if (!isnumber(data.createdAt)) {
                return false;
              }
              

              if (!isstring(data.title)) {
                return false;
              }
              

              if (!isstring(data.state)) {
                return false;
              }
              

              if (!isstring(data.summary)) {
                return false;
              }
              

              if (!isstring(data.author)) {
                return false;
              }
              

              if (!isstring(data.dataHash)) {
                return false;
              }
              

              if (!isstring(data.content)) {
                return false;
              }
              

              if (!isstring(data.remark)) {
                return false;
              }
              
  return true;
}
        
export function isLicense(data: any): boolean {
  return is(
    "UNLICENSED")(data)||is( "NOCLAIM")(data)||is( "CC BY-SA")(data)||is( "CC BY-ND")(data)||is( "CC BY-NC")(data)||is( "CC BY-NC-SA")(data)||is( "CC BY-NC-ND")(data)||is( "CC0")(data);
}
        
export function isArticleSupplement(data: any): boolean {
  
              if (!isLicense(data.license)) {
                return false;
              }
              
  return true;
}
        
export function isTokenRecord(data: any): boolean {
  
              if (!isstring(data.content)) {
                return false;
              }
              

              if (!isnumber(data.expiration)) {
                return false;
              }
              
  return true;
}
        
export function isRSAPublicKeyRecord(data: any): boolean {
  
              if (!isstring(data.key)) {
                return false;
              }
              
  return true;
}
        
export function isPrivileges(data: any): boolean {
  return is( "admin")(data)||is( "normal")(data);
}
        
export function isScryptRecord(data: any): boolean {
  
              if (!isstring(data.hash)) {
                return false;
              }
              

              if (!isnumber(data.keylen)) {
                return false;
              }
              

              if (!isstring(data.salt)) {
                return false;
              }
              
  return true;
}
        export const isAccountId = isstring;
export function isMaltaaAccount(data: any): boolean {
  
              if (!isAccountId(data.id)) {
                return false;
              }
              

              if (!isstring(data.username)) {
                return false;
              }
              

              if (!isPreferences(data.preferences)) {
                return false;
              }
              

              if (!isPasswordRecord(data.password)) {
                return false;
              }
              
  return true;
}
        
export function isAssortmentUIIdentifier(data: any): boolean {
  
              if (!isstring(data.ownerUsername)) {
                return false;
              }
              

              if (!isAssortmentContentType(data.contentType)) {
                return false;
              }
              

              if (!isstring(data.subpath)) {
                return false;
              }
              
  return true;
}
        
export function isPathState(data: any): boolean {
  
              if (!isstring(data.username)) {
                return false;
              }
              

              if (!isstring(data.articleId)) {
                return false;
              }
              

              if (!isAssortmentUIIdentifier(data.assortment)) {
                return false;
              }
              
  return true;
}
        
export function isMattersEntityType(data: any): boolean {
  return is( "article")(data)||is( "user")(data);
}
        
export function isAssortmentBaseItem(data: any): boolean {
  
              if (!isstring(data.id)) {
                return false;
              }
              

              if (!isUserId(data.collector)) {
                return false;
              }
              

              if (!isnumber(data.collectionTime)) {
                return false;
              }
              

              if (!isstring(data.review)) {
                return false;
              }
              

              if (!isUserId(data.lastReviewer)) {
                return false;
              }
              

              if (!isnumber(data.lastReviewTime)) {
                return false;
              }
              
  return true;
}
        
export function isMattersEntityItem(data: any): boolean {
  
              if (!isMattersEntityType(data.entityType)) {
                return false;
              }
              
  return true;
}
        export const isAssortmentId = isstring;
export function isAssortmentContentType(data: any): boolean {
  return is( "anthology")(data)||is( "roll")(data)||is( "mixture")(data);
}
        
export function isAssortmentIdentifier(data: any): boolean {
  
              if (!isUserId(data.owner)) {
                return false;
              }
              

              if (!isAssortmentContentType(data.contentType)) {
                return false;
              }
              

              if (!isstring(data.subpath)) {
                return false;
              }
              
  return true;
}
        
export function isAssortmentPolicy(data: any): boolean {
  
  return true;
}
        
export function isAssortment(data: any): boolean {
  
              if (!isAssortmentId(data.id)) {
                return false;
              }
              

              if (!isstring(data.title)) {
                return false;
              }
              

              if (!isstring(data.subpath)) {
                return false;
              }
              

              if (!isstring(data.description)) {
                return false;
              }
              

              if (!isUserId(data.owner)) {
                return false;
              }
              

              if (!isAssortmentContentType(data.contentType)) {
                return false;
              }
              

              if (!isAssortmentPolicy(data.policy)) {
                return false;
              }
              
  return true;
}
        export const isAuthTokenId = isstring;
export function isAuthToken(data: any): boolean {
  
              if (!isAuthTokenId(data.id)) {
                return false;
              }
              

              if (!isAccountId(data.holder)) {
                return false;
              }
              

              if (!isstring(data.secret)) {
                return false;
              }
              

              if (!isnumber(data.created)) {
                return false;
              }
              
  return true;
}
        
export function isPaginationStatus(data: any): boolean {
  
              if (!isnumber(data.nextPage)) {
                return false;
              }
              

              if (!isnumber(data.receivedItems)) {
                return false;
              }
              
  return true;
}
        
export function isPodiumPageState(data: any): boolean {
  
              if (!isArticleSort(data.sort)) {
                return false;
              }
              

              if (!isnumber(data.period)) {
                return false;
              }
              

              if (!isnumber(data.backtrack)) {
                return false;
              }
              

              if (!isPaginationStatus(data.pagination)) {
                return false;
              }
              
  return true;
}
        
export function isArticlePageState(data: any): boolean {
  
  return true;
}
        
export function isUserPageState(data: any): boolean {
  
  return true;
}
        
export function isPageName(data: any): boolean {
  return is(
    "podium")(data)||is( "study")(data)||is( "article")(data)||is( "user")(data)||is( "assortment")(data);
}
        
export function isStudyPageState(data: any): boolean {
  
  return true;
}
        
export function isAssortmentPageState(data: any): boolean {
  
  return true;
}
        
export function isClientUIState(data: any): boolean {
  
              if (!isPagesState(data.pages)) {
                return false;
              }
              
  return true;
}
        
export function isArticleSort(data: any): boolean {
  return is( "comments")(data)||is( "recent")(data)||is( "appreciationAmount")(data);
}
        
export function isCommentSort(data: any): boolean {
  return is( "recent")(data)||is( "old")(data);
}
        
export function isBaseMeta(data: any): boolean {
  
              if (!isMaltaaAction(data.request)) {
                return false;
              }
              

              if (!isstring(data.acid)) {
                return false;
              }
              

              if (!isAccountId(data.account)) {
                return false;
              }
              
  return true;
}
        
export function isBaseAction(data: any): boolean {
  
  return true;
}
        
export function isChangePathname(data: any): boolean {
  
              if (!isstring(data.pathname)) {
                return false;
              }
              
  return true;
}
        
export function isProvideEntities(data: any): boolean {
  
  return true;
}
        
export function isSetPodiumCursor(data: any): boolean {
  
              if (!isArticleSort(data.sort)) {
                return false;
              }
              

              if (!isnumber(data.period)) {
                return false;
              }
              

              if (!isnumber(data.backtrack)) {
                return false;
              }
              
  return true;
}
        
export function isLoadPodiumArticles(data: any): boolean {
  
              if (!isArticleSort(data.sort)) {
                return false;
              }
              

              if (!isnumber(data.periodInDays)) {
                return false;
              }
              

              if (!isnumber(data.backtrackInDays)) {
                return false;
              }
              

              if (!isnumber(data.pageNumber)) {
                return false;
              }
              
  return true;
}
        
export function isViewArticle(data: any): boolean {
  
              if (!isArticleId(data.article)) {
                return false;
              }
              
  return true;
}
        
export function isViewUser(data: any): boolean {
  
              if (!isstring(data.username)) {
                return false;
              }
              
  return true;
}
        
export function isGoHome(data: any): boolean {
  
  return true;
}
        
export function isSearch(data: any): boolean {
  
              if (!isstring(data.keyword)) {
                return false;
              }
              
  return true;
}
        
export function isStartAuthenticationDialog(data: any): boolean {
  
  return true;
}
        
export function isStartPreferencesDialog(data: any): boolean {
  
  return true;
}
        
export function isStartMeDialog(data: any): boolean {
  
  return true;
}
        
export function isSetMyPreferences(data: any): boolean {
  
              if (!isPartial<Preferences>(data.preferencesPatch)) {
                return false;
              }
              
  return true;
}
        
export function isLoadedStoredPreferences(data: any): boolean {
  
              if (!isPreferences(data.preferences)) {
                return false;
              }
              
  return true;
}
        
export function isGenericError(data: any): boolean {
  
              if (!isstring(data.reason)) {
                return false;
              }
              
  return true;
}
        
export function isGenericOk(data: any): boolean {
  
  return true;
}
        
export function isCancelDialog(data: any): boolean {
  
  return true;
}
        
export function isRegister(data: any): boolean {
  
              if (!isstring(data.username)) {
                return false;
              }
              

              if (!isstring(data.password)) {
                return false;
              }
              

              if (!isPreferences(data.preferences)) {
                return false;
              }
              
  return true;
}
        
export function isSignin(data: any): boolean {
  
              if (!isstring(data.username)) {
                return false;
              }
              

              if (!isstring(data.password)) {
                return false;
              }
              
  return true;
}
        
export function isSearchResultArticleRedirect(data: any): boolean {
  
              if (!isArticleId(data.id)) {
                return false;
              }
              
  return true;
}
        
export function isGoToPage(data: any): boolean {
  
              if (!isPageName(data.page)) {
                return false;
              }
              
  return true;
}
        
export function isGetMyData(data: any): boolean {
  
  return true;
}
        
export function isCreateAssortment(data: any): boolean {
  
              if (!isstring(data.title)) {
                return false;
              }
              

              if (!isstring(data.subpath)) {
                return false;
              }
              

              if (!isAssortmentContentType(data.contentType)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentAddItem(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              

              if (!isItemSpec(data.item)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentDropItem(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              

              if (!isstring(data.itemId)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentOrderItems(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentEditReview(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              

              if (!isstring(data.targetItemId)) {
                return false;
              }
              

              if (!isstring(data.review)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentSetPolicy(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              

              if (!isAssortmentPolicy(data.policy)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentEditTitle(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              

              if (!isstring(data.title)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentEditSubpath(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              

              if (!isstring(data.subpath)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentEditUpstreams(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortmentSyncFromUpstreams(data: any): boolean {
  
              if (!isAssortmentId(data.target)) {
                return false;
              }
              
  return true;
}
        
export function isUpdateAssortment(data: any): boolean {
  return is(
    UpdateAssortmentAddItem)(data)||is( UpdateAssortmentDropItem)(data)||is( UpdateAssortmentOrderItems)(data)||is( UpdateAssortmentEditReview)(data)||is( UpdateAssortmentSetPolicy)(data)||is( UpdateAssortmentEditTitle)(data)||is( UpdateAssortmentEditSubpath)(data)||is( UpdateAssortmentEditUpstreams)(data)||is( UpdateAssortmentSyncFromUpstreams)(data);
}
        
export function isSignout(data: any): boolean {
  
  return true;
}
        
export function isViewAssortment(data: any): boolean {
  
  return true;
}
        
export function isMaltaaAction(data: any): boolean {
  return is(
    ChangePathname)(data)||is( ProvideEntities)(data)||is( SetPodiumCursor)(data)||is( ViewArticle)(data)||is( ViewUser)(data)||is( GoHome)(data)||is( Search)(data)||is( StartAuthenticationDialog)(data)||is( LoadPodiumArticles)(data)||is( SetMyPreferences)(data)||is( GenericError)(data)||is( LoadedStoredPreferences)(data)||is( CancelDialog)(data)||is( StartPreferencesDialog)(data)||is( Register)(data)||is( SearchResultArticleRedirect)(data)||is( StartMeDialog)(data)||is( GoToPage)(data)||is( GetMyData)(data)||is( CreateAssortment)(data)||is( Signout)(data)||is( GenericOk)(data)||is( UpdateAssortment)(data)||is( Signin)(data)||is( ViewAssortment)(data);
}
        