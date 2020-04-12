import { MaltaaAction } from "../../../definitions/actions";
import {ClientState, getInitialClientState} from "./reducer";

export function crossPreReducer(state: ClientState, action: MaltaaAction): ClientState {
    switch (action.type) {
        default: {
            return state
        }
    }
}

export function crossPostReducer(state: ClientState, action: MaltaaAction): ClientState {
    switch (action.type) {
        default: {
            return state;
        }
    }
}
