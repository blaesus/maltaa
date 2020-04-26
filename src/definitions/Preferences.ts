import { ArticleSort, CommentSort } from "../sorts";
import { UserId } from "./User";

export interface Preferences {
    version: number,

    data: {
        screenedUsers: UserId[],
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
        showVotes: boolean,
    },

    identity: {
        operator: UserId | null,
    },

    privacy: {
        doNotTrack: 0 | 1 | null,
    },
}

export interface LeveledCommentPreferences {
    sort: CommentSort,
    displayThreshold: number,
}

