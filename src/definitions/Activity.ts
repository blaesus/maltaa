import { MaltaaAction } from "./Actions";

export type ActivityId = string;

export interface Activity {
    id: ActivityId,
    action: MaltaaAction,
    time: number,
}