import { MaltaaAction } from "../../../definitions/actions";
import {ClientUIState, getInitialUIState, uiReducer} from "./uiReducer";
import { preferencesReducer } from "./preferencesReducer";
import {entitiesReducer, EntitiesState, getInitialEntitiesState} from "./entitiesReducer";
import { crossPostReducer, crossPreReducer } from "./crossReducer";
import { getFallbackPreferences } from "../../../utils";
import {Preferences} from "../../../definitions/data-types";

export interface ClientState {
    entities: EntitiesState,
    ui: ClientUIState,
    preferences: Preferences,
}


export function getInitialClientState(
    preferences?: Preferences,
): ClientState {
    return {
        entities: getInitialEntitiesState(),
        ui: getInitialUIState(preferences),
        preferences: preferences || getFallbackPreferences(),
    }
}

export function reducer(state: ClientState, action: MaltaaAction): ClientState {
    state = crossPreReducer(state, action);
    state = {
        entities: entitiesReducer(state.entities, action),
        ui: uiReducer(state.ui, action),
        preferences: preferencesReducer(state.preferences, action),
    };
    state = crossPostReducer(state ,action);
    return state;
}

