import { ArticleSort } from "../sorts";
import { LeveledCommentPreferences, TagId } from "./data-types";
import { UserId } from "./Article";

export interface Preferences {
    version: number,

    data: {
        screenedUsers: UserId[],
        screenedTags: TagId[],
        followedUsers: UserId[],
    }

    styles: {
        customCSS: string,
    }

    podium: {
        defaultSort: ArticleSort,
        defaultPeriod: number,
        hoverPreview: boolean,
    },

    articles: {
        showUpstreams: boolean,
        showDownstreams: boolean,
        showMattersLink: boolean,
        showArticleDevInfo: boolean,
        appreciateMaxButton: boolean,
    },

    comments: {
        firstLevel: LeveledCommentPreferences,
        secondLevel: LeveledCommentPreferences,
    },

    identity: {
        operator: UserId | null,
    },

    privacy: {
        doNotTrack: 0 | 1 | null,
    },
}

