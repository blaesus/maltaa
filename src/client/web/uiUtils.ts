import { MouseEvent } from "react";
import { THREAD_PREFIX, USER_URL_SIGIL } from "../../settings";
import { articleIdToSerial } from "../../matters-specifics";
import { ArticleId, Preferences, UserId } from "../../definitions/data-types";
import { DeepPartial } from "../../utils";
import { MaltaaAction } from "../../definitions/actions";
import {ClientUIState} from "./states/uiReducer";

export function serializeToPathName(state: DeepPartial<ClientUIState>): string {
    if (state.pages?.current === "user") {
        return `/${USER_URL_SIGIL}${state.pages.user?.name}`
    }
    else if (state.pages?.current === "article" && state.pages.article?.id) {
        return `/${THREAD_PREFIX}${articleIdToSerial(state.pages.article?.id, atob)}`
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
