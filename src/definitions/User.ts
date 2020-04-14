export type UserId = string;

export interface UserPublic {
    id: UserId,
    uuid: string,
    userName: string,
    displayName: string,
    avatar: string,
    info: {
        createdAt: number,
        userNameEditable: boolean,
        description: string,
        agreeOn: number,
        profileCover: string | null,
    },
    followees: UserId[]
    status: {
        state: "active" | "onboarding" | "banned" | "frozen" | "archived",
        role: "admin" | "user",
        unreadFolloweeArticles: boolean,
        unreadResponseInfoPopup: boolean,
    },
}

