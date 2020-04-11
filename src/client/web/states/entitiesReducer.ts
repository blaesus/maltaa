import {AccountSelf, Article, Comment, ObjectMap, UserPublic} from "../../../data-types";
import { MaltaaAction } from "../../../definitions/actions";
import { mergeArray } from "../../../utils";

export interface EntitiesState {
    articles: ObjectMap<Article>,
    comments: ObjectMap<Comment>,
    users: ObjectMap<UserPublic>,
    me: AccountSelf | null,
}

export function entitiesReducer(entities: EntitiesState, action: MaltaaAction): EntitiesState {
    switch (action.type) {
        case "ProvideEntities": {
            const nextEntities = {...entities};
            nextEntities.articles = mergeArray(nextEntities.articles, action.data.articles);
            nextEntities.users = mergeArray(nextEntities.users, action.data.users);
            nextEntities.comments = mergeArray(nextEntities.comments, action.data.comments);
            nextEntities.me = action.data.me || entities.me;

            return nextEntities;
        }
        default: {
            return entities;
        }
    }
}
