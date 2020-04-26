import { AssortmentContentType, AssortmentIdentifier } from "./Assortment";

export type UserPageTab = "articles" | "comments";

export type PageName =
    "podium"
    | "study"
    | "article"
    | "user"
    | "assortment"

export interface AssortmentUIIdentifier extends Omit<AssortmentIdentifier, "owner"> {
    ownerUsername: string,
    contentType: AssortmentContentType
    subpath: string,
}

