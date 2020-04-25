import * as React from "react";
import "./CommentTree.css";
import {commentSorts} from "../../../../../sorts";
import {commentIdToSerial} from "../../../../../mattersSpecifics";
import {Byline} from "../../Byline/Byline";
import {HtmlRender} from "../../HtmlRender/HtmlRender";
import { heuristicallyShouldIndent } from "./shouldIndent";
import { AnchorButton } from "../../AnchorButton/AnchorButton";
import {INFINITY_JSON} from "../../../../../utils";
import { Article, ArticleId, CommentId, Comment } from "../../../../../definitions/Article";
import { ObjectMap } from "../../../../../definitions/Objects";
import { UserId, UserPublic } from "../../../../../definitions/User";
import { Preferences } from "../../../../../definitions/Preferences";
import { CommentContent } from "./CommentContent";

type DisplayMode = "peek" | "extend-all" | "fold";

function extendButtonText(
    mode: DisplayMode,
    reminders: number,
    level: number
): string {
    let instruction: string = "";
    switch (mode) {
        case "peek": {
            if (reminders) {
                instruction =`查看之後${reminders}條`
            }
            else {
                instruction = "摺疊"
            }
            break;
        }
        case "extend-all": {
            instruction ="摺疊";
            break;
        }
        case "fold": {
            if (reminders) {
                instruction = `展開${reminders}條`
            }
            else {
                instruction = "摺疊"
            }
            break;
        }
    }
    if (level >= 1) {
        instruction = `> ${instruction}`
    }
    return instruction
}

function thresholdToMode(threshold: number): DisplayMode {
    if (threshold === 0) {
        return "fold"
    }
    else if (threshold >= INFINITY_JSON) {
        return "extend-all";
    }
    else {
        return "peek";
    }
}

export function CommentTree(props: {
    root: CommentId | ArticleId,
    level: number,
    articles: ObjectMap<Article>,
    comments: ObjectMap<Comment>,
    users: ObjectMap<UserPublic>,
    screenedUsers: UserId[],
    preferences: Preferences,
    onUserTagClick?(username: string): void
    parentWidth?: number,
}) {
    const { root, articles, comments, users, level, preferences, parentWidth } = props;

    const contentDom = React.useRef<HTMLDivElement>(null);
    const [myContentWidth, setMyContentWidth] = React.useState(parentWidth || 0);
    React.useEffect(() => {
        const width = contentDom.current ? contentDom.current.getBoundingClientRect().width : 0;
        setMyContentWidth(width);
    }, [contentDom.current]);

    const peekThreshold = level === 0
        ? preferences.comments.firstLevel.displayThreshold
        : preferences.comments.secondLevel.displayThreshold
    const initialMode: DisplayMode = thresholdToMode(peekThreshold);
    const [displayMode, setDisplayMode] = React.useState<DisplayMode>(initialMode);
    let allSubComments: Comment[] = [];
    const rootAsArticle = articles[root];
    let rootAsComment: Comment | null = comments[root];
    let author: UserPublic | null = null;
    if (rootAsArticle) {
        allSubComments = Object.values(comments).filter(c => c.parent === rootAsArticle.id);
        author = users[rootAsArticle.author];
    }
    else if (rootAsComment) {
        allSubComments = Object.values(comments).filter(c => c.parent === root);
        author = users[rootAsComment.author];
    }
    else {
        return null;
    }
    const commentSort = level === 0
        ? commentSorts[preferences.comments.firstLevel.sort]
        : commentSorts[preferences.comments.secondLevel.sort];
    const filteredSubComments = allSubComments.filter(
        c => !props.screenedUsers.includes(c.author) && c.state === "active"
    );
    const sortedSubComments = filteredSubComments.sort(commentSort);
    const domId = rootAsComment ? rootAsComment.id : undefined;

    let subCommentDisplayThreshold: number;
    switch (displayMode) {
        case "peek": {
            subCommentDisplayThreshold = peekThreshold;
            break;
        }
        case "extend-all": {
            subCommentDisplayThreshold = Infinity;
            break;
        }
        case "fold": {
            subCommentDisplayThreshold = 0;
            break;
        }
    }

    const subCommentsForDisplay = sortedSubComments.slice(0, subCommentDisplayThreshold);
    const reminders = filteredSubComments.length - subCommentsForDisplay.length;
    const shouldModeButtonIndent = level >= 1 && displayMode !== "fold";

    return (
        <div className="CommentTree" id={domId} data-level={level}>
            <a
                className="CommentScrollAnchor"
                id={rootAsComment ? commentIdToSerial(rootAsComment.id, atob).toString() : ""}
            />
            {
                rootAsComment && author &&
                <CommentContent
                    comment={rootAsComment}
                    author={author}
                    treeWidth={myContentWidth}
                    domRef={contentDom}
                    onAuthorClick={() => props.onUserTagClick && author && props.onUserTagClick(author.userName)}
                />
            }
            {
                subCommentsForDisplay.map((comment) =>
                    <CommentTree
                        key={comment.id}
                        root={comment.id}
                        level={props.level + 1}
                        articles={articles}
                        comments={comments}
                        users={users}
                        preferences={preferences}
                        screenedUsers={props.screenedUsers}
                        onUserTagClick={props.onUserTagClick}
                        parentWidth={myContentWidth}
                    />
                )
            }
            {
                level <= 1 && sortedSubComments.length > 0 &&
                <AnchorButton
                    className={`DisplayModeButton ${shouldModeButtonIndent ? "indent" : ""}`}
                    onClick={() => setDisplayMode(mode => {
                        switch (mode) {
                            case "peek": {
                                const allPeeked = reminders === 0;
                                if (allPeeked) {
                                    return "fold";
                                }
                                else {
                                    return "extend-all";
                                }
                            }
                            case "extend-all": {
                                return "fold";
                            }
                            case "fold": {
                                return "extend-all";
                            }
                        }
                    })}
                >
                    {extendButtonText(displayMode, reminders, level)}
                </AnchorButton>
            }
        </div>
    )
}
