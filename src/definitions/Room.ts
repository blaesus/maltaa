import { UserId } from "./User";

export type RoomId = string;

interface Room {
    id: RoomId,
    mattersArticleBaseId: string,
    owner: UserId,
    admins: UserId[],
    name: string,
    openForSubmission: boolean,
    adultOnly: boolean,
}

