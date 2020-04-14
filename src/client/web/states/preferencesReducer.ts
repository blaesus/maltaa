import { MaltaaAction } from "../../../definitions/Actions";
import { Preferences } from "../../../definitions/Preferences";

export function preferencesReducer(preferences: Preferences, action: MaltaaAction): Preferences {
    switch (action.type) {
        case "ProvideEntities": {
            return {
                ...preferences,
                ...action.data.me?.preferences,
            }
        }
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

