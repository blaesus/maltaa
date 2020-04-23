import { MaltaaAction } from "../../definitions/Actions";
import { ClientUIState } from "./states/uiReducer";
import { Assortment, AssortmentContentType, AssortmentIdentifier } from "../../definitions/Assortment";
import { ClientState } from "./states/reducer";
import { Preferences } from "../../definitions/Preferences";

import { STUDY_SUBPATH, THREAD_PREFIX, USER_URL_SIGIL } from "../../settings";
import { articleIdToSerial, articleSerialToId } from "../../mattersSpecifics";
import { assortmentSigil, assortmentTypes } from "../../utils";

export interface AssortmentUIIdentifier extends Omit<AssortmentIdentifier, "owner"> {
    ownerUsername: string,
    contentType: AssortmentContentType
    subpath: string,
}

export function assortmentPathPrefix(identifier: Pick<AssortmentUIIdentifier, "ownerUsername" | "contentType">): string {
    const {ownerUsername, contentType} = identifier;
    return `/${USER_URL_SIGIL}${ownerUsername}/${assortmentSigil[contentType]}/`;
}

export function assortmentPath(identifier: AssortmentUIIdentifier): string {
    const {subpath} = identifier;
    return `${assortmentPathPrefix(identifier)}${subpath}`;
}

export function articleUrl(articleId: string) {
    return `/${THREAD_PREFIX}${articleIdToSerial(articleId, atob)}`;
}


export interface PathState {
    username?: string,
    articleId?: string,
    assortment?: AssortmentUIIdentifier,
    page?: "study"
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
                            subpath: decodeURIComponent(thirdSegment),
                        },
                    };
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
    else if (firstSegment === STUDY_SUBPATH) {
        return {
            page: "study"
        };
    }

    return {};
}

export function serializeToPathName(state: ClientUIState): string {
    if (state.pages.current === "user") {
        return `/${USER_URL_SIGIL}${state.pages.user.name}`;
    }
    else if (state.pages.current === "article" && state.pages.article.id) {
        return articleUrl(state.pages.article.id);
    }
    else if (state.pages.current === "study") {
        return `/${STUDY_SUBPATH}`;
    }
    else if (state.pages.current === "assortment" && state.pages.assortment.identifier) {
        return assortmentPath(state.pages.assortment.identifier);
    }
    else {
        return "/";
    }
}

export type MouseEvent = any;

export function getAnchorClickHandler(onClick?: () => void) {
    return function (event: MouseEvent) {
        if (onClick) {
            if (!event.metaKey && !event.altKey && !event.ctrlKey) {
                event.preventDefault();
                onClick();
            }
        }
    };
}

const PREFERENCES_KEY = "PREFERENCES";

export function loadStoredPreference(): Preferences | undefined {
    try {
        const saved = localStorage.getItem(PREFERENCES_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {
    }
}

export function storePreference(preferences: Preferences) {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
    }
}

export function getViewportWidth() {
    return window.innerWidth;
}

export type MaltaaDispatch = (action: MaltaaAction) => void;


export function findAssortmentFromState(state: ClientState, identifier: AssortmentUIIdentifier): Assortment | null {
    const owner = Object.values(state.entities.users).find(u => u.userName === identifier.ownerUsername);
    if (!owner) {
        return null;
    }
    const assortment = Object.values(state.entities.assortments).find(
        a => a.owner === owner.id
            && a.subpath === identifier.subpath
            && a.contentType === identifier.contentType,
    );
    if (!assortment) {
        return null;
    }
    return assortment;
}
