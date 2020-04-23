import { Assortment } from "./definitions/Assortment";
import { isAssortment } from "./validators";

const forbiddenSubpathCharacters = ["/", "#", ":", "?"];

export function isLegalSubpath(subpath: string): boolean {
    return subpath.length > 0
           && forbiddenSubpathCharacters.every(char => !subpath.includes(char))
}

export function isLegalAssortment(assortment: Assortment): boolean {
    if (!isAssortment(assortment)) {
        return false;
    }
    const {title, subpath} = assortment;
    return (
        title.length > 0
        && isLegalSubpath(subpath)
    );
}