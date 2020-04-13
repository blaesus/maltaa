import { MaltaaAction } from "../../../definitions/actions";
import { ClientState } from "./reducer";
import { AssortmentUIIdentifier } from "../uiUtils";

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
        case "ViewAssortment": {
            let identifier: AssortmentUIIdentifier | null = null;
            if (typeof action.assortment === "string") {
                const assortment = state.entities.assortments[action.assortment];
                if (assortment) {
                    const owner = state.entities.users[assortment.owner];
                    if (owner) {
                        identifier = {
                            ownerUsername: owner.userName,
                            subpath: assortment.subpath,
                            contentType: assortment.contentType,
                        }
                    }
                }
            } else if (typeof action.assortment === "object") {
                identifier = action.assortment;
            }

            if (identifier) {
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        pages: {
                            ...state.ui.pages,
                            current: "assortment",
                            assortment: {
                                identifier,
                            }
                        }
                    }
                }
            } else {
                return state;
            }
        }
        default: {
            return state;
        }
    }
}
