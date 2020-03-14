import ApolloClient from "apollo-boost";
import gql from "graphql-tag";
import * as fetch from "isomorphic-fetch"
import { dedupe, last } from "../utils";
import { Article, Comment, Transaction, UserId, UserPublic } from "../data-types";
import { v4 as uuidv4 } from "uuid";

const TX_REQUEST_COUNT = 200;
const COMMENT_REQUEST_COUNT = 200;

function typenameRemoveMapper<T>(obj: T): T {
    let x: any = {
        ...obj,
    };
    delete x['__typename'];
    return x
}

const apolloClient = new ApolloClient({
    uri: "https://server.matters.news/graphql",
    fetch,
});

type ArticleQueryMode = "newest" | "hottest";

function getArticleDigestQuery(mode: "newest" | "hottest") {
    return gql`
    query($first: Int!, $after: String) {
      viewer {
        recommendation {
          ${mode}(input: {first: $first, after: $after}) {
            edges {
              cursor,
              node {
                id,
                mediaHash,
              }
            }
          }
        }
      }
    }
`;
}

interface ArticleSummaryResponseInner {
    id: string,
    mediaHash: string,
}


interface ArticleSummaryResponse {
    viewer: {
        recommendation: {
            [key in ArticleQueryMode]?: {
                edges: {
                    cursor: string,
                    node: ArticleSummaryResponseInner
                }[]
            }
        }
    }
}

export type ArticleDigest = Pick<
    Article,
    "mediaHash"
>

export async function fetchArticleMHs(
    count: number,
    mode: ArticleQueryMode = "newest",
    cursor?: string,
): Promise<{mhs: string[], lastCursor: string}> {
    const response = await apolloClient.query<ArticleSummaryResponse>({
        query: getArticleDigestQuery(mode),
        variables: {
            first: count,
            after: cursor,
        }
    });
    const edges = response.data.viewer.recommendation[mode]?.edges;
    if (!edges) {
        throw new Error("Empty response");
    }
    const summaries: ArticleDigest[] = edges.map(edge => edge.node).map(typenameRemoveMapper);
    const lastCursor = last(edges)?.cursor || "";
    return {
        mhs: summaries.map(s => s.mediaHash),
        lastCursor,
    };
}

const fetchOneArticleQuery = gql`
query($mediaHash: String!) {
 article(input: {mediaHash: $mediaHash}) {
    mediaHash
    id
    topicScore
    slug
    createdAt
    title
    state
    public
    live
    cover
    summary
    author {
       id,
    }
    dataHash
    sticky
    content
    tags {
      id
    }
    appreciationsReceived(input: {first: ${TX_REQUEST_COUNT}}) {
        edges {
            cursor,
            node {
                amount,
                createdAt,
                sender {
                    id,
                    displayName
                },
            }
        }
    }
    
    comments(input: {sort: newest, first: ${COMMENT_REQUEST_COUNT}}) {
      totalCount,
      edges {
        node {
          id,
          createdAt,
          content,
          author {
            id,
          },
          parentComment {
            id,
          },
          replyTo {
            id,
          }
        }
      }
    }
 }
}
`;

interface CommentResponseNode extends Omit<Comment, "author"| "replyTarget" | "parent" | "rootPost"> {
    author: {
        id: string
    },
    parentComment: {
        id: string,
    } | null,
    replyTo: {
        id: string,
    } | null
}

interface AppreciationResponseNode extends Omit<Transaction,
    "mid" | "sender" | "createdAt" | "recipient" | "target"
> {
    sender: {
        id: string,
    },
    createdAt: string,
}

interface ArticleResponseNode extends Omit<Article, "author" | "comments" | "createdAt" | "tags" | "appreciations"> {
    createdAt: string,
    author: {id: string},
    tags: {id: string}[],
    comments: {
        edges: {
            node: CommentResponseNode,
        }[]
    },
    appreciationsReceived: {
        edges: {
            node: AppreciationResponseNode,
        }[]
    },
}

interface ArticleResponseData {
    article: ArticleResponseNode | null
}

interface ArticleFetchData {
    article: Article,
    comments: Comment[],
    transactions: Transaction[],
    mentionedUsers: UserId[],
}

export async function fetchArticle(mediaHash: string): Promise<ArticleFetchData | null> {
    const response = await apolloClient.query<ArticleResponseData>({
        query: fetchOneArticleQuery,
        variables: {
            mediaHash,
        }
    });
    if (!response.data.article) {
        return null
    }
    const { article: articleResponse } = response.data;

    const comments: Comment[] = articleResponse.comments.edges.map(edge => ({
        ...edge.node,
        author: edge.node.author.id,
        replyTarget: edge.node.replyTo && edge.node.replyTo.id,
        parent: edge.node.parentComment ? edge.node.parentComment.id : "",
        createdAt: +new Date(edge.node.createdAt),
    })).map(typenameRemoveMapper);

    const transactions: Transaction[] = articleResponse.appreciationsReceived.edges.map(edge => ({
        ...edge.node,
        mid: uuidv4(),
        sender: edge.node.sender.id,
        createdAt: +new Date(edge.node.createdAt),
        target: articleResponse.mediaHash,
        recipient: articleResponse.author.id,
    })).map(typenameRemoveMapper);

    const article: Article = typenameRemoveMapper({
        ...articleResponse,
        author: articleResponse.author.id,
        tags: articleResponse.tags.map(node => node.id),
        createdAt: +new Date(articleResponse.createdAt),
        comments: comments.map(comment => comment.id),
        appreciations: transactions.map(tx => tx.mid),
    });

    const mentionedUsers: UserId[] = [
        ...comments.map(comment => comment.author),
        ...transactions.map(tx => tx.sender),
        article.author
    ].filter(dedupe);

    // Inherited from response
    delete (article as any)["appreciationsReceived"];
    return {
        article,
        comments,
        transactions,
        mentionedUsers,
    };
}

const fetchOneUserQuery = gql`
query($id: ID!) {
  node(input: {id: $id} ) {
    ... on User {
      id,
      uuid,
      userName,
      displayName,
      isBlocked,
      info {
        createdAt,
        userNameEditable,
        description,
        agreeOn,
        profileCover,
      }
      followers(input: {first: 200}) {
        totalCount,
        edges {
          cursor,
          node {
            id
          }
        }   
      }
      followees(input: {first: 200}) {
        totalCount,
        edges {
          cursor,
          node {
            id
          }
        }
      }
      status {
        state,
        role,
        unreadFolloweeArticles,
        unreadResponseInfoPopUp,
      }
    }
  }
}
`;

interface UserResponseNode extends Omit<UserPublic, "followees" | "info"> {
    info: {
        createdAt: string,
        userNameEditable: boolean,
        description: string,
        agreeOn: string,
        profileCover: string | null,
    }
    followees: {
        totalCount: number,
        edges: {cursor: string, node: {id: string}}[],
    }
    followers: {
        totalCount: number,
        edges: {cursor: string, node: {id: string}}[],
    }
}

type UserResponse = {
    node: UserResponseNode,
}

interface UserFetchData {
    user: UserPublic,
    mentionedUsers: UserId[],
}

export async function fetchUser(id: string): Promise<UserFetchData | null> {
    const response = await apolloClient.query<UserResponse>({
        query: fetchOneUserQuery,
        variables: {
            id,
        }
    });

    const userResponse = response.data.node;
    if (!userResponse) {
        return null;
    }

    const user: UserPublic = typenameRemoveMapper({
        ...userResponse,
        followees: userResponse.followees.edges.map(edge => edge.node.id),
        info: {
            createdAt: +new Date(userResponse.info.createdAt),
            userNameEditable: userResponse.info.userNameEditable,
            description: userResponse.info.description,
            agreeOn: +new Date(userResponse.info.agreeOn),
            profileCover: userResponse.info.profileCover,
        }
    });
    const mentionedUsers = [
        ...userResponse.followees.edges.map(edge => edge.node.id),
        ...userResponse.followees.edges.map(edge => edge.node.id),
        user.id,
    ].filter(dedupe);
    delete (user as any).followers;
    delete (user as any).status.__typename;

    return {
        user,
        mentionedUsers,
    };
}
