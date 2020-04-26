import * as React from "react";
import { useEffect } from "react";

import "./ArticlePage.css";

import { MaltaaAction } from "../../../../definitions/Actions";
import { ArticleSort } from "../../../../sorts";
import { ClientState } from "../../states/reducer";

import { CommentTree } from "../Comments/CommentTree";
import { Byline } from "../Byline/Byline";
import { HtmlRender } from "../HtmlRender/HtmlRender";
import { Divider } from "./Divider/Divider";
import { StreamList } from "./StreamList/StreamList";

import { mattersArticleUrl } from "../../../../mattersSpecifics";
import { ArticleId } from "../../../../definitions/Article";
import { AssortmentList } from "../AssortmentEditor/AssortmentList";


export function ArticlePage(props: {
    articleId: ArticleId | null,
    state: ClientState
    dispatch(action: MaltaaAction): void,
}) {
    const {articleId, state, dispatch} = props;
    const {articles, users, comments} = state.entities;


    useEffect(() => {
        if (state.ui.pages.current === "article") {
            window.scroll(0, 0);
        }
        if (articleId && !articles[articleId]) {
            dispatch({
                type: "ViewArticle",
                article: articleId,
            });
        }
    }, [articleId]);

    if (!articleId) {
        return null;
    }
    if (state.ui.pages.current !== "article") {
        return null;
    }

    const streamSort: ArticleSort = "recent";
    const screenedUsers = state.preferences.data.screenedUsers;
    const hoverPreview = state.preferences.podium.hoverPreview;
    const article = articles[articleId];
    if (!article) {
        return <div>正加載文章{articleId}，請稍候……</div>;
    }
    const author = users[article.author];
    const upstreams = article.upstreams.map(id => articles[id]).filter(Boolean);
    const downstreams = Object.values(articles).filter(a => a.upstreams.includes(article.id));
    return (
        <article className="ArticlePage">
            <section className="root-content">
                <h1 className="title">{article.title}</h1>
                <HtmlRender html={article.content}/>
                <Byline
                    author={author}
                    publishTime={article.createdAt}
                    onAuthorClick={() => dispatch({type: "ViewUser", username: author.userName})}
                />
            </section>

            <Divider text="-30-"/>

            <StreamList
                label="引用文章"
                emptyLabel="未有引用文章"
                streams={upstreams}
                screenedUsers={screenedUsers}
                users={users}
                sort={streamSort}
                hoverPreview={hoverPreview}
                dispatch={dispatch}
            />

            <StreamList
                label="引用本文的文章"
                emptyLabel="未有引用本文的文章"
                foldLimit={5}
                streams={downstreams}
                screenedUsers={screenedUsers}
                users={users}
                sort={streamSort}
                hoverPreview={hoverPreview}
                dispatch={dispatch}
            />
            <AssortmentList
                state={state}
                entityId={article.id}
                entityType="article"
                dispatch={dispatch}
            />
            <footer className="Internals">
                {
                    state.preferences.articles.showMattersLink &&
                    <a
                        className="MattersOrigin"
                        href={mattersArticleUrl(article, author)}
                    >
                        Matters源
                    </a>
                }
                {
                    state.preferences.articles.showArticleDevInfo &&
                    <pre className="ArticleDevInfo"><code>{JSON.stringify(article, null, 4)}</code></pre>
                }
            </footer>

            <Divider height={10}/>

            <h3>
                {
                    article.derived.comments > 0 &&
                    `${article.derived.comments}條評論`
                }
                {
                    article.derived.comments === 0 &&
                    `未有評論`
                }
            </h3>

            <section className="CommentSection">
                <CommentTree
                    root={article.id}
                    level={0}
                    articles={articles}
                    comments={comments}
                    users={users}
                    screenedUsers={screenedUsers}
                    preferences={state.preferences}
                    onUserLabelClick={username => dispatch({type: "ViewUser", username})}
                />
            </section>
        </article>
    );
}
