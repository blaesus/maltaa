import { MaltaaAction } from "../../../definitions/actions";
import { Preferences } from "../../../data-types";

export function preferencesReducer(preferences: Preferences, action: MaltaaAction): Preferences {
    switch (action.type) {
        case "SetMyPreferences": {
            return {
                ...preferences,
                ...action.preferencesPatch,
            }
        }
        case "LoadedStoredPreferences": {
            return {
                ...preferences,
                ...action.preferences,
            }
        }
        default: {
            return preferences;
        }
    }
}

