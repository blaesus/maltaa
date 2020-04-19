import { MaltaaAction } from "../../../definitions/Actions";
import { ClientState } from "./reducer";
import { AssortmentUIIdentifier } from "../uiUtils";
import { AssortmentContentType } from "../../../definitions/Assortment";

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
        case "ProvideEntities": {
            const request = action?.meta?.request;
            switch (request?.type) {
                case "UpdateAssortment": {
                    if (
                        request.operation === "EditSubpath"
                        && state.ui.pages.current === "assortment"
                    ) {
                        const target = state.entities.assortments[request.target];
                        const owner = state.entities.users[target?.owner];
                        if (target && owner) {
                            return {
                                ...state,
                                ui: {
                                    ...state.ui,
                                    pages: {
                                        ...state.ui.pages,
                                        assortment: {
                                            identifier: {
                                                ownerUsername: owner.userName,
                                                contentType: target.contentType,
                                                subpath: target.subpath,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return state;
                }
                case "CreateAssortment": {
                    const assortments = action?.data?.assortments;
                    if (assortments) {
                        const created = assortments[0];
                        if (created) {
                            const owner = state.entities.users[created.owner];
                            return {
                                ...state,
                                ui: {
                                    ...state.ui,
                                    pages: {
                                        ...state.ui.pages,
                                        assortment: {
                                            identifier: {
                                                ownerUsername: owner.userName,
                                                contentType: created.contentType,
                                                subpath: created.subpath,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return state;
                }
                default: {
                    return state;
                }
            }
        }
        default: {
            return state;
        }
    }
}
