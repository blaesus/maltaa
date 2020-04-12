import { MaltaaAction } from "../../../definitions/actions";
import {ClientState, getInitialClientState} from "./reducer";

// Executed before all branched reducers
export function crossPreReducer(state: ClientState, action: MaltaaAction): ClientState {
    switch (action.type) {
        default: {
            return state
        }
    }
}

// Executed after all branched reducers
export function crossPostReducer(state: ClientState, action: MaltaaAction): ClientState {
    switch (action.type) {

        default: {
            return state;
        }
    }
}
