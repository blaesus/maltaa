import { Article, ArticleId, CommentId } from "./definitions/Article";
import { UserId, UserPublic } from "./definitions/User";
import { TagId } from "./definitions/Tag";

const ArticleIdPrefix = `Article:`;

export function articleSerialToId(serial: number, btoa: (s: string) => string): ArticleId {
    return btoa(`${ArticleIdPrefix}${serial}`).replace(/=/g, "");
}

export function userSerialToId(serial: number, btoa: (s: string) => string): UserId {
    return btoa(`User:${serial}`).replace(/=/g, "");
}

export function tagSerialToId(serial: number, btoa: (s: string) => string): TagId {
    return btoa(`Tag:${serial}`).replace(/=/g, "");
}

export function tagIdToSerial(id: TagId, atob: (s: string) => string): number {
    return Number.parseInt(atob(id).replace("Tag:", ""));
}

export function userIdToSerial(id: UserId, atob: (s: string) => string): number {
    return Number.parseInt(atob(id).replace("User:", ""));
}

export function articleIdToSerial(id: ArticleId, atob: (s: string) => string): number {
    return Number.parseInt(atob(id).replace(ArticleIdPrefix, ""));
}

export function commentIdToSerial(id: CommentId, atob: (s: string) => string): number {
    return Number.parseInt(atob(id).replace("Comment:", ""));
}

export function commentSerialToId(serial: number, btoa: (s: string) => string): TagId {
    return btoa(`Comment:${serial}`).replace(/=/g, "");
}

export function isArticleId(s: string, atob: (s: string) => string): boolean {
    try {
        const decoded = atob(s)
        return decoded.startsWith(ArticleIdPrefix);
    } catch {
        return false;
    }
}

const usernameSigil = `@`;

export function isFullUserName(s: string): boolean {
    return s.startsWith(usernameSigil) && s.length >= 2;
}

export function deprefixUserName(s: string): string {
    return s.slice(usernameSigil.length);
}

export function isMattersArticleUrl(url: string): boolean {
    const regex = /matters\.news\/@.*\/.*/;
    return !!regex.exec(url);
}

export function mattersArticleUrl(article: Article, author?: UserPublic): string {
    // username is insignificant by March 2020.
    return `https://matters.news/${usernameSigil}${author?.userName || "_"}/${article.slug}-${article.mediaHash}`;
}

export function mattersUserUrl(user: UserPublic): string {
    // username is insignificant by March 2020.
    return `https://matters.news/${usernameSigil}${user.userName}`;
}

interface TokenInfo {
    uuid: string,
    iatS: number,
    expS: number,
}

export function parseToken(token: string, atob: (s: string) => string): TokenInfo | null {
    const segments = token.split('.');
    const centralSegment = segments[1];
    if (!centralSegment) {
        return null;
    }
    else {
        try {
            return JSON.parse(atob(centralSegment));
        }
        catch {
            return null;
        }
    }
}
