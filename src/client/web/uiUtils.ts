import { MouseEvent } from "react";
import { THREAD_PREFIX, USER_URL_SIGIL } from "../../settings";
import {articleIdToSerial, articleSerialToId} from "../../matters-specifics";
import { ArticleId, Preferences, UserId } from "../../definitions/data-types";
import {assortmentPrefix, assortmentTypes} from "../../utils";
import { MaltaaAction } from "../../definitions/actions";
import {ClientUIState} from "./states/uiReducer";
import {AssortmentContentType, AssortmentIdentifier} from "../../definitions/assortment";

export interface AssortmentUIIdentifier extends Omit<AssortmentIdentifier, "owner"> {
    ownerUsername: UserId,
    contentType: AssortmentContentType
    subpath: string,
}

export function assortmentUrl(identifier: AssortmentUIIdentifier): string {
    const {ownerUsername, contentType, subpath} = identifier;
    return `/${USER_URL_SIGIL}${ownerUsername}/${assortmentPrefix[contentType]}/${subpath}`;
}

export function articleUrl(articleId: string) {
    return `/${THREAD_PREFIX}${articleIdToSerial(articleId, atob)}`;
}


export interface PathState {
    username?: string,
    articleId?: string,
    assortment?: AssortmentUIIdentifier,
}

export function parsePathName(pathName: string): PathState {
    const segments = pathName.split("/");
    const firstSegment = segments[1];
    if (firstSegment.startsWith(USER_URL_SIGIL)) {
        const username = firstSegment.replace(USER_URL_SIGIL, "");
        const secondSegment = segments[2];
        if (secondSegment) {
            const contentType = assortmentTypes[secondSegment];
            if (contentType) {
                const thirdSegment = segments[3];
                if (thirdSegment) {
                    return {
                        username,
                        assortment: {
                            ownerUsername: username,
                            contentType: contentType,
                            subpath: thirdSegment,
                        }
                    }
                }
            }
        }
        return {username};
    }
    else if (firstSegment.startsWith(THREAD_PREFIX)) {
        const targetArticleSerial = Number(firstSegment.replace(THREAD_PREFIX, "")) || 0;
        const id = articleSerialToId(targetArticleSerial, btoa);
        return {
            articleId: id,
        };
    }
    return {};
}

export function serializeToPathName(state: ClientUIState): string {
    if (state.pages.current === "user") {
        return `/${USER_URL_SIGIL}${state.pages.user.name}`
    }
    else if (state.pages?.current === "article" && state.pages.article.id) {
        return articleUrl(state.pages.article.id);
    }
    else if (state.pages?.current === "assortment" && state.pages.assortment.identifier) {
        return assortmentUrl(state.pages.assortment.identifier);
    }
    else {
        return "/"
    }
}

export function getAnchorClickHandler(onClick?: () => void) {
    return function (event: MouseEvent<HTMLAnchorElement>) {
        if (onClick) {
            if (!event.metaKey && !event.altKey && !event.ctrlKey) {
                event.preventDefault();
                onClick();
            }
        }
    }
}

const PREFERENCES_KEY = "PREFERENCES";

export function loadStoredPreference(): Preferences | undefined {
    try {
        const saved = localStorage.getItem(PREFERENCES_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    }
    catch {}
}

export function storePreference(preferences: Preferences) {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
    }
    catch {}
}

export function getViewportWidth() {
    return window.innerWidth;
}

export type MaltaaDispatch = (action: MaltaaAction) => void;

export type OptionList<Value = string> = {value: Value, label: string}[]
