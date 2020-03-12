import ApolloClient from "apollo-boost";
import gql from "graphql-tag";
import * as fetch from "isomorphic-fetch"
import { last } from "../utils";
import { Article, Comment } from "../data-types";

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
            newest: {
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
    "id" | "mediaHash"
>

export async function fetchNewest(
    count: number,
    cursor?: string
): Promise<{summaries: ArticleDigest[], lastCursor: string}> {
    const response = await apolloClient.query<ArticleSummaryResponse>({
        query: getArticleDigestQuery("newest"),
        variables: {
            first: count,
            after: cursor,
        }
    });
    const edges = response.data.viewer.recommendation.newest.edges;
    const summaries: ArticleDigest[] = edges.map(edge => edge.node).map(typenameRemoveMapper);
    const lastCursor = last(edges)?.cursor || "";
    return {
        summaries,
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
       uuid,
    }
    dataHash
    sticky
    content
    
    comments(input: {sort: newest, first: 200}) {
      totalCount,
      edges {
        node {
          id,
          createdAt,
          content,
          author {
            id,
            uuid,
            userName,
            displayName,
            avatar,
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

export interface UserCore {
    id: string,
}


interface CommentResponseNode extends Omit<Comment, "author"| "replyTarget" | "parent" | "createdAt"> {
    createdAt: string,
    author: UserCore,
    parentComment: {
        id: string,
    } | null,
    replyTo: {
        id: string,
    } | null
}

interface ArticleResponseNode extends Omit<Article, "author" | "comments"> {
    author: UserCore,
    comments: {
        edges: {
            node: CommentResponseNode
        }[]
    }

}

interface ArticleResponseData {
    article: ArticleResponseNode | null
}

export async function fetchArticle(mediaHash: string): Promise<Article | null> {
    const response = await apolloClient.query<ArticleResponseData>({
        query: fetchOneArticleQuery,
        variables: {
            mediaHash,
        }
    });
    if (!response.data.article) {
        return null
    }
    const comments: Comment[] = response.data.article.comments.edges.map(edge => ({
        ...edge.node,
        author: edge.node.author.id,
        replyTarget: edge.node.replyTo && edge.node.replyTo.id,
        parent: edge.node.parentComment ? edge.node.parentComment.id : "",
        createdAt: +new Date(edge.node.createdAt)
    }));
    const article: Article = {
        ...response.data.article,
        author: response.data.article.author.id,
        comments,
    };
    return article;
}

const fetchUserQuery = gql`
query($userName: String) {
  user(userName: $userName) {
    id
  }
}
`;

interface UserResponse {
    id: string
}

export async function fetchUser(userName: string) {
    const response = await apolloClient.query<UserResponse>({
        query: fetchUserQuery,
        variables: {
            userName
        }
    });
}
