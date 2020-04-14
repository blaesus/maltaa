import { MaltaaAction } from "../../../definitions/Actions";
import {mergeArray, newEmptyObject} from "../../../utils";
import {Assortment} from "../../../definitions/Assortment";
import { Article, Comment } from "../../../definitions/Article";
import { ObjectMap } from "../../../definitions/data-types";
import { UserPublic } from "../../../definitions/User";
import { AccountSelf } from "../../../definitions/MaltaaAccount";

export interface EntitiesState {
    articles: ObjectMap<Article>,
    comments: ObjectMap<Comment>,
    assortments: ObjectMap<Assortment>,
    users: ObjectMap<UserPublic>,
    me: AccountSelf | null,
}

export function getInitialEntitiesState(): EntitiesState {
    return {
        articles: newEmptyObject(),
        comments: newEmptyObject(),
        users: newEmptyObject(),
        assortments: newEmptyObject(),
        me: null,
    };
}

export function entitiesReducer(entities: EntitiesState, action: MaltaaAction): EntitiesState {
    switch (action.type) {
        case "ProvideEntities": {
            const nextEntities = {...entities};
            nextEntities.articles = mergeArray(nextEntities.articles, action.data.articles);
            nextEntities.users = mergeArray(nextEntities.users, action.data.users);
            nextEntities.comments = mergeArray(nextEntities.comments, action.data.comments);
            nextEntities.assortments = mergeArray(nextEntities.assortments, action.data.assortments);
            nextEntities.me = action.data.me || entities.me;

            return nextEntities;
        }
        case "Signout": {
            return getInitialEntitiesState();
        }
        default: {
            return entities;
        }
    }
}
