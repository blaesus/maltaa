export type TagId = string;

export interface Tag {
    id: TagId,
    content: string,
    createdAt: number,
    cover: string | {},
    description: string | null,
}

