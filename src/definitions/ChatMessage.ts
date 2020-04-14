import { CommentId } from "./Article";
import { UserId } from "./User";

interface ChatMessage {
    id: string,
    mattersCommentBaseId: CommentId | null,
    sender: UserId,
    receiver: UserId,
    messageType: "plain"
    messageBody: string,
}

