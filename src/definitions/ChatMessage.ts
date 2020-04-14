import { CommentId, UserId } from "./Article";

interface ChatMessage {
    id: string,
    mattersCommentBaseId: CommentId | null,
    sender: UserId,
    receiver: UserId,
    messageType: "plain"
    messageBody: string,
}

