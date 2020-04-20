import { Assortment } from "./definitions/Assortment";

const forbiddenSubpathCharacters = ["/", "#", ":", "?"];

export function isWellFormedSubpath(subpath: string): boolean {
    return subpath.length > 0
           && forbiddenSubpathCharacters.every(char => !subpath.includes(char))
}

export function isWellFormedAssortment(assortment: Assortment): boolean {
    const {title, subpath} = assortment;
    return (
        title.length > 0
        && isWellFormedSubpath(subpath)
    );
}