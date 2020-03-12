export interface Comment {
    id: string,
    createdAt: number,
    content: string,
    author: string,
    parent: string,
    replyTarget: string | null,
}

export interface Article {
    mediaHash: string,
    id: string,
    topicScore: number
    slug: string,
    createdAt: string,
    title: string,
    state: string,
    public: boolean,
    live: boolean,
    cover: string | null,
    summary: string,
    author: string,
    dataHash: string,
    sticky: boolean,
    content: string,
    comments: Comment[],
}
