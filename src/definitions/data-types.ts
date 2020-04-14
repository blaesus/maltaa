import {ArticleSort, CommentSort} from "../sorts";
import { CommentId, UserId } from "./Article";

export type ObjectWithId = {id: string}

export type ObjectMap<T extends ObjectWithId> = {[key in string]: T};

export interface LeveledCommentPreferences {
    sort: CommentSort,
    displayThreshold: number,
}

