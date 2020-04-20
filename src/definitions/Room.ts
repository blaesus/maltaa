import { UserId } from "./User";

export type RoomId = string;

export interface RoomPolicy {

}

interface Room {
    id: RoomId,
    description: string;
    mattersArticleBaseId: string | null,
    global: boolean,
    owner: UserId,
    admins: UserId[],
    name: string,
    policy: RoomPolicy,
}

