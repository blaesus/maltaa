import {MaltaaAction} from "../../definitions/actions";

export const maltaaApi = {
    async action(action: MaltaaAction): Promise<MaltaaAction> {
        const response = await fetch(`/api/action?type=${action.type}`, {
            method: "POST",
            body: JSON.stringify(action),
        });
        return response.json();
    }
};

