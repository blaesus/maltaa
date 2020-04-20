import * as React from "react";
import "./PreferencesDialog.css";
import { ObjectMap } from "../../../../definitions/Objects";
import { PodiumPeriodChooser, PodiumSortChooser } from "../PreferenceChoosers";
import { MaltaaDispatch } from "../../uiUtils";
import { Chooser, OptionList } from "../Chooser/Chooser";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { CommentSort } from "../../../../sorts";
import { INFINITY_JSON } from "../../../../utils";
import { Preferences } from "../../../../definitions/Preferences";
import { UserPublic } from "../../../../definitions/User";

const booleanOptions = [
    {
        label: "顯示",
        value: true,
    },
    {
        label: "隱藏",
        value: false,
    },
];

const commentSortOptions: OptionList<CommentSort> = [
    {
        label: "從舊到新",
        value: "old",
    },
    {
        label: "從新到舊",
        value: "recent",
    },
];

const displayModeOptions = [
    {
        label: "摺疊全部",
        value: 0,
    },
    {
        label: "展開全部",
        value: INFINITY_JSON,
    },
    {
        label: "展開2條",
        value: 2,
    },
];

function CommentSection(props: {
    label: string,
    sort: CommentSort,
    onChooseSort(sort: CommentSort): void,
    threshold: number,
    onChooseThreshold(threshold: number): void,
}) {
    return (
        <section>
            <h2>{props.label}</h2>
            <section>
                <h3>排序</h3>
                <Chooser
                    options={commentSortOptions}
                    chosen={props.sort}
                    onChoose={props.onChooseSort}
                />
            </section>
            <section>
                <h3>默認顯示方法</h3>
                <Chooser
                    options={displayModeOptions}
                    chosen={props.threshold}
                    onChoose={props.onChooseThreshold}
                />
            </section>
        </section>
    );
}

export function PreferencesDialog(props: {
    preferences: Preferences,
    users: ObjectMap<UserPublic>,
    dispatch: MaltaaDispatch,
}) {
    const {preferences, users, dispatch} = props;
    return (
        <form className="PreferencesDialog">
            <h1>設置</h1>
            <section className="ScreenUserManager">
                <h2>屏蔽用戶</h2>
                {
                    preferences.data.screenedUsers.length === 0 &&
                    "未屏蔽任何用戶"
                }
                {
                    preferences.data.screenedUsers.map(userId => {
                        const user = users[userId];
                        return (
                            <div key={userId}>
                                {user ? user.userName : userId}
                                <AnchorButton onClick={() => {
                                    dispatch({
                                        type: "SetMyPreferences",
                                        preferencesPatch: {
                                            data: {
                                                ...preferences.data,
                                                screenedUsers: preferences.data.screenedUsers.filter(u => u !== userId),
                                            },
                                        },
                                    });
                                }}>
                                    取消屏蔽
                                </AnchorButton>
                            </div>
                        );
                    })
                }
            </section>
            <section>
                <h2>廣場排序</h2>
                <PodiumSortChooser
                    chosen={preferences.podium.defaultSort}
                    onChange={sort => dispatch({
                        type: "SetMyPreferences",
                        preferencesPatch: {
                            podium: {
                                ...preferences.podium,
                                defaultSort: sort,
                            },
                        },
                    })}
                />
            </section>
            <section>
                <h2>廣場週期</h2>
                <PodiumPeriodChooser
                    chosen={preferences.podium.defaultPeriod}
                    onChange={period => dispatch({
                        type: "SetMyPreferences",
                        preferencesPatch: {
                            podium: {
                                ...preferences.podium,
                                defaultPeriod: period,
                            },
                        },
                    })}
                />
            </section>
            <section>
                <h2>文章内容預覽飘窗</h2>
                <Chooser
                    options={booleanOptions}
                    chosen={preferences.podium.hoverPreview}
                    onChoose={shouldHover => {
                        dispatch({
                            type: "SetMyPreferences",
                            preferencesPatch: {
                                podium: {
                                    ...preferences.podium,
                                    hoverPreview: shouldHover,
                                },
                            },
                        });
                    }}
                />
            </section>
            <section>
                <h2>文章內部數據（JSON）</h2>
                <Chooser
                    options={booleanOptions}
                    chosen={preferences.articles.showArticleDevInfo}
                    onChoose={value => {
                        dispatch({
                            type: "SetMyPreferences",
                            preferencesPatch: {
                                articles: {
                                    ...preferences.articles,
                                    showArticleDevInfo: value,
                                },
                            },
                        });
                    }}
                />
            </section>
            <section>
                <h2>Matters源鏈接</h2>
                <Chooser
                    options={booleanOptions}
                    chosen={preferences.articles.showMattersLink}
                    onChoose={value => {
                        dispatch({
                            type: "SetMyPreferences",
                            preferencesPatch: {
                                articles: {
                                    ...preferences.articles,
                                    showMattersLink: value,
                                },
                            },
                        });
                    }}
                />
            </section>
            <section>
                <h2>自定義CSS</h2>
                <textarea
                    className="CSSInput"
                    onChange={event => {
                        dispatch({
                            type: "SetMyPreferences",
                            preferencesPatch: {
                                styles: {
                                    ...preferences.styles,
                                    customCSS: event.target.value,
                                },
                            },
                        });

                    }}
                    value={preferences.styles.customCSS}
                />
            </section>
            <CommentSection
                label="一級評論"
                sort={preferences.comments.firstLevel.sort}
                onChooseSort={sort => {
                    dispatch({
                        type: "SetMyPreferences",
                        preferencesPatch: {
                            comments: {
                                ...preferences.comments,
                                firstLevel: {
                                    ...preferences.comments.firstLevel,
                                    sort,
                                },
                            },
                        },
                    });
                }}
                threshold={preferences.comments.firstLevel.displayThreshold}
                onChooseThreshold={displayThreshold => {
                    dispatch({
                        type: "SetMyPreferences",
                        preferencesPatch: {
                            comments: {
                                ...preferences.comments,
                                firstLevel: {
                                    ...preferences.comments.firstLevel,
                                    displayThreshold,
                                },
                            },
                        },
                    });
                }}
            />
            <CommentSection
                label="二級評論"
                sort={preferences.comments.secondLevel.sort}
                onChooseSort={sort => {
                    dispatch({
                        type: "SetMyPreferences",
                        preferencesPatch: {
                            comments: {
                                ...preferences.comments,
                                secondLevel: {
                                    ...preferences.comments.secondLevel,
                                    sort,
                                },
                            },
                        },
                    });
                }}
                threshold={preferences.comments.secondLevel.displayThreshold}
                onChooseThreshold={displayThreshold => {
                    dispatch({
                        type: "SetMyPreferences",
                        preferencesPatch: {
                            comments: {
                                ...preferences.comments,
                                secondLevel: {
                                    ...preferences.comments.secondLevel,
                                    displayThreshold,
                                },
                            },
                        },
                    });
                }}
            />
        </form>
    );
}
