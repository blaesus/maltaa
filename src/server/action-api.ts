import { ClientRequest, MaltaaAction } from "../definitions/Actions";

import { register } from "./mappers/register";
import { createAssortment } from "./mappers/createAssortment";
import { signout } from "./mappers/signout";
import { viewArticle } from "./mappers/viewArticle";
import { updateAssortment } from "./mappers/updateAssortment";
import { viewAssortment } from "./mappers/viewAssortment";
import { signin } from "./mappers/signin";
import { setMyPreferences } from "./mappers/setMyPreferences";
import { search } from "./mappers/search";
import { getMyData } from "./mappers/getMyData";
import { viewUser } from "./mappers/viewUser";
import { loadPodiumArticles } from "./mappers/loadPodiumArticles";

export async function routeRequest(request: ClientRequest): Promise<MaltaaAction> {
    switch (request.type) {
        case "LoadPodiumArticles": {
            return loadPodiumArticles(request);
        }
        case "ViewUser": {
            return viewUser(request);
        }
        case "ViewArticle": {
            return viewArticle(request);
        }
        case "Register": {
            return register(request);
        }
        case "GetMyData": {
            return getMyData(request);
        }
        case "CreateAssortment": {
            return createAssortment(request);
        }
        case "UpdateAssortment": {
            return updateAssortment(request);
        }
        case "Signout": {
            return signout(request);
        }
        case "ViewAssortment": {
            return viewAssortment(request);
        }
        case "Search": {
            return search(request);
        }
        case "Signin": {
            return signin(request);
        }
        case "SetMyPreferences": {
            return setMyPreferences(request);
        }
        default: {
            return {
                type: "GenericError",
                reason: "unknown type",
            };
        }
    }
}

export async function respond(request: ClientRequest): Promise<MaltaaAction> {
    let response: MaltaaAction;
    try {
        response = await routeRequest(request);
    } catch (error) {
        response = {
            type: "GenericError",
            reason: error.message,
        };
    }
    response.meta = {
        ...response.meta,
        request,
    };
    return response;
}
