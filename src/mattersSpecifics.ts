import { Article, ArticleId, CommentId, TagId, UserId, UserPublic } from "./definitions/data-types";

export function articleSerialToId(serial: number, btoa: (s: string) => string): ArticleId {
    return btoa(`Article:${serial}`).replace(/=/g, "");
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
    return Number.parseInt(atob(id).replace("Article:", ""));
}

export function commentIdToSerial(id: CommentId, atob: (s: string) => string): number {
    return Number.parseInt(atob(id).replace("Comment:", ""));
}

export function isMattersArticleUrl(url: string): boolean {
    const regex = /matters\.news\/@.*\/.*/;
    return !!regex.exec(url);
}

export function mattersArticleUrl(article: Article, author?: UserPublic): string {
    // username is insignificant by March 2020.
    return `https://matters.news/@${author ? author.userName : "_"}/${article.slug}-${article.mediaHash}`;
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
