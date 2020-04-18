import * as React from "react";
import { useEffect, useState } from "react";

import "./ArticlePage.css"

import { MaltaaAction } from "../../../../definitions/Actions";
import { ArticleSort } from "../../../../sorts";
import { Assortment } from "../../../../definitions/Assortment";
import { ClientState } from "../../states/reducer";

import { CommentTree } from "./CommentTree/CommentTree";
import { Byline } from "../Byline/Byline";
import { HtmlRender } from "../HtmlRender/HtmlRender";
import { Divider } from "./Divider/Divider";
import { StreamList } from "./StreamList/StreamList";
import { AnchorButton } from "../AnchorButton/AnchorButton";

import { mattersArticleUrl } from "../../../../mattersSpecifics";
import { AssortmentSummary } from "../AssortmentSummary/AssortmentSummary";
import { ArticleId } from "../../../../definitions/Article";
import { hasIntersection } from "../../../../utils";


export function ArticlePage(props: {
    articleId: ArticleId | null,
    state: ClientState
    dispatch(action: MaltaaAction): void,
}) {
    const {articleId, state, dispatch} = props;
    const {articles, users, comments} = state.entities;

    const [addingToMyAssortments, setAddingToMyAssortments] = useState(false);

    useEffect(() => {
        if (state.ui.pages.current === "article") {
            window.scroll(0, 0);
        }
        if (articleId && !articles[articleId]) {
            dispatch({
                type: "ViewArticle",
                article: articleId,
            })
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
    const addedAssortments =
        Object.values(state.entities.assortments)
              .filter(a => a.items.some(item => item.id === article.id));
    const myAssortmentsForAdding: Assortment[] =
        Object.values(state.entities.assortments)
              .filter(a =>
                  !a.archived &&
                  (a.contentType === "article" || a.contentType === "mixed") &&
                  addedAssortments.every(includedAssortment => includedAssortment.id !== a.id) &&
                  hasIntersection(a.editors, state.entities.me?.mattersIds)
              );
    return (
        <article className="ArticlePage">
            <section className="root-content">
                <h1>{article.title}</h1>
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

            <div className="AssortmentList">

                {
                    addedAssortments.length === 0 && `未有集合收錄本文`
                }

                {
                    addedAssortments.length > 0 && `${addedAssortments.length}個集合收錄本文`
                }
                {
                    addedAssortments.map(assortment => (
                        <AssortmentSummary
                            key={assortment.id}
                            assortment={assortment}
                            owner={state.entities.users[assortment.owner]}
                            onClick={() => {
                                dispatch({
                                    type: "ViewAssortment",
                                    assortment: assortment.id,
                                })
                            }}
                        />
                    ))
                }
                {
                    !addingToMyAssortments &&
                    <AnchorButton onClick={() => setAddingToMyAssortments(true)}>加入我的集合</AnchorButton>
                }
                {
                    addingToMyAssortments &&
                    myAssortmentsForAdding
                        .map(assortment => {
                            return (
                                <div key={assortment.id}>
                                    <AnchorButton onClick={() => {
                                        dispatch({
                                            type: "UpdateAssortment",
                                            operation: "AddItem",
                                            target: assortment.id,
                                            item: {
                                                source: "matters",
                                                entityType: "article",
                                                id: article.id,
                                                note: "",
                                            },
                                        });
                                    }}>
                                        加入{assortment.title}
                                    </AnchorButton>
                                </div>
                            )
                        })
                }

            </div>

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
                    onUserTagClick={username => dispatch({type: "ViewUser", username})}
                />
            </section>
        </article>
    )
}
