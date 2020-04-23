import { v4 as uuidv4 } from "uuid";
import ApolloClient from "apollo-boost";
import gql from "graphql-tag";
import * as fetch from "isomorphic-fetch";

import { Article, ArticleId, Comment } from "../definitions/Article";
import { UserId, UserPublic } from "../definitions/User";
import { Transaction } from "../definitions/Transaction";
import { Tag } from "../definitions/Tag";

import { dedupe, last, SECOND, sleep } from "../utils";

// To test high edge,
// appreciations: bafyreifckcbis24jqthtjxq7b52h7s2os5oszlkrhb4pdrzl3i53avdgma
// comments: zdpuApwK98VnSKQS4ucPeWWzQf852wPHg7dAaNB2Bf5VCkvGd

const EDGE_COUNT_PER_REQUEST = 100;
const LOW_EDGE_COUNT_PER_REQUEST = 10;

const EDGE_REQUEST_INTERVAL = 0.1 * SECOND;
const DEFAULT_EDGE_REQUEST_TIMEOUT = 10 * SECOND;

function deepClean<T extends any>(obj: T, undesirableField: string): T {
    if (Array.isArray(obj)) {
        return obj.map((element: any) => deepClean(element, undesirableField));
    }
    else if (typeof obj === "object" && obj !== null) {
        const result: T = {
            ...obj,
        };
        delete result[undesirableField];
        for (let key in result) {
            if (result.hasOwnProperty(key)) {
                result[key] = deepClean(result[key], undesirableField);
            }
        }
        return result;
    }
    else {
        return obj;
    }
}

const deepCleanTypename = <T>(obj: T): T => deepClean<T>(obj, "__typename");

// Make a new one for each session to ensure no cache.
const getApolloClient = () => new ApolloClient({
    uri: "https://server.matters.news/graphql",
    fetch,
});

async function fetchAllEdges<N>(
    seedEdges: Edge<N>[],
    getNewEdges: (cursor: string) => Promise<Edge<N>[]>,
    maxEdgeFetchTimeMs: number = DEFAULT_EDGE_REQUEST_TIMEOUT,
): Promise<Edge<N>[]> {
    let edges = [...seedEdges];

    let lastCursor = last(edges)?.cursor;
    if (!lastCursor) {
        return edges;
    }
    let start = Date.now();
    while (true) {
        await sleep(EDGE_REQUEST_INTERVAL);
        const newEdges = await getNewEdges(lastCursor);
        if (!newEdges.length) {
            break;
        }
        edges = [
            ...edges,
            ...newEdges,
        ];
        lastCursor = last(edges)?.cursor;
        if (!lastCursor) {
            break;
        }
        if (Date.now() - start > maxEdgeFetchTimeMs) {
            break;
        }
    }

    return edges;
}

export type ArticleQueryMode = "newest" | "hottest";

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
              }
            }
          }
        }
      }
    }
`;
}

type Edge<N> = {
    cursor: string,
    node: N,
}

interface ArticleSummaryResponseInner {
    id: string,
}

interface ArticleSummaryResponse {
    viewer: {
        recommendation: {
            [key in ArticleQueryMode]?: {
                edges: Edge<ArticleSummaryResponseInner>[]
            }
        }
    }
}

export type ArticleDigest = Pick<Article,
    "id">

export async function fetchArticleIds(
    count: number,
    mode: ArticleQueryMode = "newest",
    cursor?: string | null,
): Promise<{ ids: ArticleId[], lastCursor: string | null }> {
    const client = getApolloClient();
    const response = await client.query<ArticleSummaryResponse>({
        query: getArticleDigestQuery(mode),
        variables: {
            first: count,
            after: cursor,
        },
    });
    const edges = response.data.viewer.recommendation[mode]?.edges;
    if (!edges) {
        throw new Error("Empty response");
    }
    const summaries: ArticleDigest[] = edges.map(edge => edge.node).map(deepCleanTypename);
    const lastCursor = last(edges)?.cursor || null;
    return {
        ids: summaries.map(s => s.id),
        lastCursor,
    };
}

function articleBasicGql() {
    return `
    id
    mediaHash
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
`;
}

const commentNodeGql = `
  id,
  createdAt,
  state,
  content,
  author {
    id,
  },
  parentComment {
    id,
  },
  replyTo {
    id,
  },
  upvotes,
  downvotes,
`

function commentEdgeGql(after?: string) {
    return `
      comments(input: {
        sort: newest,
        first: ${EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
      }) {
      totalCount,
      edges {
        cursor, 
        node {
            ${commentNodeGql}
        }
      }
    }
    `;
}

function appreciationEdgeGql(after?: string) {
    return `
    appreciationsReceived(input: {
        first: ${EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
    }) {
        totalCount,
        edges {
            cursor,
            node {
                createdAt,
                amount,
                sender {
                    id,
                    displayName
                },
            }
        }
    }
    `;
}

function collectionEdgeGql(after?: string) {
    return `
    collection(input: {
        first: ${EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
    }) {
        totalCount,
        edges {
            cursor,
            node {
                id,
            }
        }
    }
    `;
}

function relatedArticlesEdgeGql(after?: string) {
    return `
    relatedArticles(input: {
        first: ${EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
    }) {
        totalCount,
        edges {
            cursor,
            node {
                id,
            }
        }
    }
    `;
}

function subscribersEdgeGql(after?: string) {
    return `
    subscribers(input: {
        first: ${EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
    }) {
        totalCount,
        edges {
            cursor,
            node {
                id,
            }
        }
    }
    `;
}

function featuredCommentsEdgeGql(after?: string) {
    return `
    featuredComments(input: {
        first: ${LOW_EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
    }) {
        totalCount,
        edges {
            cursor,
            node {
                id,
            }
        }
    }
    `;
}

function pinnedComments() {
    return `
    pinnedComments {
        id,
    }
    `;
}


function articleGql(options: {
    basics?: boolean,
    comment?: boolean,
    collection?: boolean,
    relatedArticles?: boolean,
    appreciations?: boolean,
    subscribers?: boolean,
    featuredComments?: boolean,
    pinnedComments?: boolean,

    commentCursor?: string,
    appreciationCursor?: string,
    collectionCursor?: string,
    relatedArticlesCursor?: string,
    subscribersCursor?: string,
    featuredCommentsCursor?: string,
} = {
    basics: true,
    comment: true,
    appreciations: true,
    collection: true,
    relatedArticles: true,
    subscribers: true,
    featuredComments: true,
    pinnedComments: true,
}) {
    return gql`
query($id: ID!) {
 node(input: {id: $id}) {
     id,
    ... on Article {
        ${options.basics ? articleBasicGql() : ""}
        ${options.appreciations ? appreciationEdgeGql(options.appreciationCursor) : ""}
        ${options.comment ? commentEdgeGql(options.commentCursor) : ""}
        ${options.collection ? collectionEdgeGql(options.collectionCursor) : ""}
        ${options.relatedArticles ? relatedArticlesEdgeGql(options.relatedArticlesCursor) : ""}
        ${options.subscribers ? subscribersEdgeGql(options.subscribersCursor) : ""}
        ${options.featuredComments ? featuredCommentsEdgeGql(options.featuredCommentsCursor) : ""}
        ${options.pinnedComments ? pinnedComments() : ""}
    }
 }
}
`;
}

interface CommentResponseNode extends Omit<Comment, "author" | "replyTarget" | "parent" | "rootPost" | "derived"> {
    author: {
        id: string
    },
    parentComment: {
        id: string,
    } | null,
    replyTo: {
        id: string,
    } | null
    upvotes: number,
    downvotes: number,
}

interface AppreciationResponseNode extends Omit<Transaction,
    "mid" | "sender" | "createdAt" | "recipient" | "target"> {
    sender: {
        id: string,
    },
    createdAt: string,
}

interface ArticleResponseFullNode extends Omit<Article,
    "author" | "comments" | "createdAt" | "tags" | "appreciations" | "upstreams" | "subscribers" | "derived"
    | "featuredComments" | "pinnedComments"> {
    createdAt: string,
    author: { id: string },
    tags: { id: string }[],
    comments: {
        totalCount: number,
        edges: Edge<CommentResponseNode>[],
    },
    appreciationsReceived: {
        totalCount: number,
        edges: Edge<AppreciationResponseNode>[],
    },
    collection: {
        totalCount: number,
        edges: Edge<{ id: string }>[],
    }
    relatedArticles: {
        totalCount: number,
        edges: Edge<{ id: string }>[],
    }
    subscribers: {
        totalCount: number,
        edges: Edge<{ id: string }>[],
    }
    featuredComments: {
        totalCount: number,
        edges: Edge<{ id: string }>[],
    }
    pinnedComments: { id: string }[]

}

interface ArticleResponseFullData {
    node: ArticleResponseFullNode | null
}

interface ArticleResponseCommentData {
    node: Pick<ArticleResponseFullNode, "comments"> | null
}

interface ArticleResponseAppreciationData {
    node: Pick<ArticleResponseFullNode, "appreciationsReceived"> | null
}

interface ArticleResponseSubscribersData {
    node: Pick<ArticleResponseFullNode, "subscribers"> | null
}


interface ArticleFetchData {
    entity: Article,
    comments: Comment[],
    transactions: Transaction[],
    mentionedUsers: UserId[],
}

function processCommentNode(node: CommentResponseNode, fallbackParent: string | null = null): Comment {
    const comment = {
        ...node,
        author: node.author.id,
        replyTarget: node.replyTo ? node.replyTo.id : null,
        parent: node.parentComment ? node.parentComment.id : fallbackParent,
        createdAt: +new Date(node.createdAt),
        derived: {
            upvotes: node.upvotes,
            downvotes: node.downvotes,
        },
    }
    delete (comment as any)["parentComment"];
    delete (comment as any)["replyTo"];
    delete (comment as any)["upvotes"];
    delete (comment as any)["downvotes"];
    return deepCleanTypename(comment);
}

export async function fetchArticle(id: ArticleId): Promise<ArticleFetchData | null> {
    const client = getApolloClient();
    const response = await client.query<ArticleResponseFullData>({
        query: articleGql(),
        variables: {
            id,
        },
    });
    if (!response.data.node) {
        return null;
    }
    const {node: articleResponse} = response.data;

    const commentEdges = await fetchAllEdges(articleResponse.comments.edges, async function (cursor) {
        const response = await client.query<ArticleResponseCommentData>({
            query: articleGql({
                basics: false,
                comment: true,
                commentCursor: cursor,
            }),
            variables: {
                id,
            },
        });
        if (!response.data.node) {
            return [];
        }
        else {
            return response.data.node.comments.edges;
        }
    });

    const comments: Comment[] = commentEdges.map(edge => processCommentNode(edge.node, articleResponse.id)).map(deepCleanTypename);

    const appreciationsEdges = await fetchAllEdges(
        articleResponse.appreciationsReceived.edges,
        async function (cursor) {
            const response = await client.query<ArticleResponseAppreciationData>({
                query: articleGql({
                    basics: false,
                    appreciations: true,
                    appreciationCursor: cursor,
                }),
                variables: {
                    id,
                },
            });
            if (!response.data.node) {
                return [];
            }
            else {
                return response.data.node.appreciationsReceived.edges;
            }
        },
    );

    const subscriberEdges = await fetchAllEdges(
        articleResponse.subscribers.edges,
        async function (cursor) {
            const response = await client.query<ArticleResponseSubscribersData>({
                query: articleGql({
                    basics: false,
                    subscribers: true,
                    subscribersCursor: cursor,
                }),
                variables: {
                    id,
                },
            });
            if (!response.data.node) {
                return [];
            }
            else {
                return response.data.node.subscribers.edges;
            }
        },
    );

    const transactions: Transaction[] = appreciationsEdges.map(edge => ({
        ...edge.node,
        mid: uuidv4(),
        sender: edge.node.sender.id,
        createdAt: +new Date(edge.node.createdAt),
        target: articleResponse.id,
        recipient: articleResponse.author.id,
    })).map(deepCleanTypename);

    const article: Article = deepCleanTypename({
        ...articleResponse,
        topicScore: articleResponse.topicScore,
        author: articleResponse.author.id,
        tags: articleResponse.tags.map(node => node.id),
        createdAt: +new Date(articleResponse.createdAt),
        upstreams: articleResponse.collection.edges.map(edge => edge.node.id),
        subscribers: subscriberEdges.map(edge => edge.node.id),
        pinnedComments: articleResponse.pinnedComments.map(node => node.id),
        derived: {
            comments: comments.length,
            commenters: comments.map(c => c.author).filter(dedupe).length,
            appreciations: transactions.length,
            appreciationAmount: transactions.map(tx => tx.amount).reduce((sum, v) => sum + v, 0),
            featuredComments: articleResponse.featuredComments.edges.map(edge => edge.node.id),
        },
    });

    delete (article as any)["relatedArticles"];
    delete (article as any)["featuredComments"];
    delete (article as any)["comments"];
    delete (article as any)["collection"];

    const mentionedUsers: UserId[] = [
        ...comments.map(comment => comment.author),
        ...transactions.map(tx => tx.sender),
        ...article.subscribers,
        article.author,
    ].filter(dedupe);

    // Inherited from response
    delete (article as any)["appreciationsReceived"];
    return {
        entity: article,
        comments,
        transactions,
        mentionedUsers,
    };
}

function userBasicsGql() {
    return `
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
      status {
        state,
        role,
        unreadFolloweeArticles,
        unreadResponseInfoPopUp,
      }
    `;
}

function followeeEdgeGql(after?: string) {
    return `
    followees(input: {
        first: ${EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
    }) {
        totalCount,
        edges {
          cursor,
          node {
            id
          }
        }
      }
    `;
}

function followerEdgeGql(after?: string) {
    return `
      followers(input: {
          first: ${EDGE_COUNT_PER_REQUEST},
          ${after ? `after: "${after}"` : ""}
      }) {
        totalCount,
        edges {
          cursor,
          node {
            id
          }
        }   
      }
    `;
}

function articlesEdgeGql(after?: string) {
    return `
    articles(input: {
        first: ${EDGE_COUNT_PER_REQUEST},
        ${after ? `after: "${after}"` : ""}
    }) {
        totalCount,
        edges {
          cursor,
          node {
            id,
          }
        }
      }
    `;
}


function userGql(options: {
    basics?: boolean,
    followers?: boolean,
    followees?: boolean,
    articles?: boolean,
    followerCursor?: string,
    followeeCursor?: string,
    articlesCursor?: string,
} = {
    basics: true,
    followers: true,
    followees: true,
    articles: true,
}) {
    return gql`
query($id: ID!) {
  node(input: {id: $id}) {
    ... on User {
      id,
      ${options.basics ? userBasicsGql() : ""}
      ${options.followers ? followerEdgeGql(options.followerCursor) : ""}
      ${options.followees ? followeeEdgeGql(options.followeeCursor) : ""}
      ${options.articles ? articlesEdgeGql(options.articlesCursor) : ""}
    }
  }
}
`;
}

interface UserResponseNode extends Omit<UserPublic, "followees" | "info"> {
    info: {
        createdAt: string,
        userNameEditable: boolean,
        description: string,
        agreeOn: string,
        profileCover: string | null,
    }
    articles: {
        totalCount: number,
        edges: Edge<{ id: string }>[],
    }
    followees: {
        totalCount: number,
        edges: Edge<{ id: string }>[],
    }
    followers: {
        totalCount: number,
        edges: Edge<{ id: string }>[],
    }
}

type UserFullResponse = {
    node: UserResponseNode,
}

type UserFolloweeResponse = {
    node: Pick<UserResponseNode, "followees">,
}

type UserFollowerResponse = {
    node: Pick<UserResponseNode, "followers">,
}


export interface UserFetchData {
    entity: UserPublic,
    mentionedArticles: ArticleId[],
    mentionedUsers: UserId[],
}

export async function fetchUser(id: string): Promise<UserFetchData | null> {
    const client = getApolloClient();
    const response = await client.query<UserFullResponse>({
        query: userGql(),
        variables: {
            id,
        },
    });

    const userResponse = response.data.node;
    if (!userResponse) {
        return null;
    }

    const followeeEdges = await fetchAllEdges(userResponse.followees.edges, async function (cursor) {
        const response = await client.query<UserFolloweeResponse>({
            query: userGql({
                followees: true,
                followeeCursor: cursor,
            }),
            variables: {
                id,
            },
        });
        if (!response.data.node) {
            return [];
        }
        else {
            return response.data.node.followees.edges;
        }
    });

    const followees: UserId[] = followeeEdges.map(edge => edge.node.id);

    const firstFollowers: UserId[] = userResponse.followers.edges.map(edge => edge.node.id);

    const user: UserPublic = deepCleanTypename({
        ...userResponse,
        followees,
        info: {
            createdAt: +new Date(userResponse.info.createdAt),
            userNameEditable: userResponse.info.userNameEditable,
            description: userResponse.info.description,
            agreeOn: +new Date(userResponse.info.agreeOn),
            profileCover: userResponse.info.profileCover,
        },
    });
    const mentionedUsers = [
        ...userResponse.followers.edges.map(edge => edge.node.id),
        ...followees,
        ...firstFollowers,
        user.id,
    ].filter(dedupe);
    const mentionedArticles = userResponse.articles.edges.map(edge => edge.node.id);
    delete (user as any).followers;
    delete (user as any).articles;

    return {
        entity: user,
        mentionedUsers,
        mentionedArticles,
    };
}

const fetchOneTag = gql`
query($id: ID!) {
  node(input: {id:$id} ) {
    ... on Tag {
      id,
      content,
      createdAt,
      cover,
      description,
    }
  }
}
`;

interface TagResponseNode extends Omit<Tag, "createdAt"> {
    createdAt: string,
}

type TagResponse = {
    node: TagResponseNode,
}

interface TagFetchData {
    entity: Tag
}

interface GraphQLError {
    message: string,
    location: {
        line: number,
        column: number
    },
    path: string[],
    extensions: {
        code: string,
        exception: {
            level: string
        }
    }
}

interface GraphQLErrorResponse {
    graphQLErrors: GraphQLError[]
}

export async function fetchTag(id: string): Promise<TagFetchData | null> {
    const client = getApolloClient();
    try {
        const response = await client.query<TagResponse>({
            query: fetchOneTag,
            variables: {
                id,
            },
        });

        const tagResponse = response.data.node;
        if (!tagResponse) {
            throw new Error("Missing node in tag response");
        }
        const tag: Tag = deepCleanTypename({
            ...tagResponse,
            createdAt: +new Date(tagResponse.createdAt),
        });
        return {entity: tag};
    } catch (error) {
        const typedError = error as GraphQLErrorResponse;
        if (typedError.graphQLErrors) {
            const firstError = typedError.graphQLErrors[0];
            if (firstError) {
                if (firstError.message === "target does not exist") {
                    return null;
                }
            }
        }
        throw error;
    }
}

const fetchOneComment = gql`
query($id: ID!) {
  node(input: {id:$id} ) {
    ... on Comment {
        ${commentNodeGql}
    }
  }
}
`;

interface CommentFetchData {
    entity: Comment
}

type CommentResponse = {
    node: CommentResponseNode,
}

export async function fetchComment(id: string): Promise<CommentFetchData | null> {
    const client = getApolloClient();
    try {
        const response = await client.query<CommentResponse>({
            query: fetchOneComment,
            variables: {
                id,
            },
        });

        const commentResponse = response.data.node;
        if (!commentResponse) {
            throw new Error("Missing node in comment response");
        }
        const comment: Comment = processCommentNode(commentResponse);
        return {entity: comment};
    } catch (error) {
        const typedError = error as GraphQLErrorResponse;
        if (typedError.graphQLErrors) {
            const firstError = typedError.graphQLErrors[0];
            if (firstError) {
                if (firstError.message === "target does not exist") {
                    return null;
                }
            }
        }
        throw error;
    }
}


interface LoginResponse {
    userLogin: {
        token: string,
    }
}

function userLoginMutation() {
    return gql`
    mutation($email: EmailAddress!, $password: String!) {
        userLogin(input: { email: $email, password: $password }) {
            token
        }
    }`;
}


export async function loginToMatters(credential: {
    email: string, password: string
}): Promise<{ token: string } | null> {
    const client = getApolloClient();
    const {email, password} = credential;
    try {
        const response = await client.mutate<LoginResponse>({
            mutation: userLoginMutation(),
            variables: {
                email,
                password,
            },
        });
        if (response.data) {
            return {
                token: response.data.userLogin.token,
            };
        }
        else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

const myIdQuery = gql`
query {
  viewer {
        id,
  }
}`;

interface MyIdResponse {
    viewer: {
        id: string,
    }
}

export async function getMyId(token: string): Promise<string | null> {
    try {
        const authedClient = new ApolloClient({
            uri: "https://server.matters.news/graphql",
            fetch,
            headers: {
                "x-access-token": token,
            },
        });
        const response = await authedClient.query<MyIdResponse>({
            query: myIdQuery,
        });
        return response.data.viewer.id;
    } catch (error) {
        return null;
    }
}

