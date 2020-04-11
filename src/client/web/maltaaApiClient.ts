import {Article, Comment, UserPublic} from "../../definitions/data-types";
import {ArticleSort} from "../../sorts";
import {RegisterFromMattersOk, RegisterFromMattersParams} from "../../api-interfaces";
import {MaltaaAction} from "../../definitions/actions";

export const maltaaApi = {
    async getUserById(id: string): Promise<UserPublic | null> {
        const response = await fetch(`/api/user/${id}`);
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return null
        }
    },
    async getArticles(sort: ArticleSort, page: number): Promise<Article[]> {
        const response = await fetch(`/api/articles?sort=${sort}&page=${page}`);
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return []
        }
    },
    async getCommentsForArticle(articleId: string): Promise<Comment[]> {
        const response = await fetch(`/api/article/${articleId}/comments`);
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return []
        }
    },
    async getThreadData(articleId: string): Promise<{articles: Article[], comments: Comment[], users: UserPublic[]} | null> {
        const response = await fetch(`/api/entities/thread/${articleId}`);
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return null;
        }
    },
    async getHomeList(
        sort: ArticleSort,
        page: number,
        earliest: number,
    ): Promise<{articles: Article[], users: UserPublic[]} | null> {
        const response = await fetch(`/api/entities/home?sort=${sort}&after=${earliest}&page=${page}`);
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return null;
        }
    },
    async getProfileData(username: string): Promise<{users: UserPublic[]} | null> {
        const response = await fetch(`/api/entities/profile/${username}`);
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return null;
        }
    },
    async interpretUrl(url: string): Promise<{entity: "article", id: string, title: string} | null> {
        const response = await fetch(`/api/interpret-url/${encodeURIComponent(url)}`);
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return null;
        }
    },
    async registerWithMatters(username: string, password: string): Promise<RegisterFromMattersOk | null> {
        const params: RegisterFromMattersParams = {
            mattersEmail: username,
            mattersPassword: password,
        };
        const response = await fetch(`/api/account`, {
            method: "POST",
            body: JSON.stringify(params)
        });
        if (response.status >= 200 && response.status < 300) {
            return await response.json()
        }
        else {
            return null;
        }
    },
    async action(action: MaltaaAction): Promise<MaltaaAction> {
        const request: MaltaaAction = {
            ...action,
            meta: {
                acid: Math.random().toString(36).slice(2),
            }
        };
        const response = await fetch(`/api/action?type=${action.type}`, {
            method: "POST",
            body: JSON.stringify(request),
        });
        return response.json();
    }
};

