import { AssortmentContentType, MattersEntityType } from "./definitions/Assortment";
import { ObjectMap, ObjectWithId } from "./definitions/Objects";
import { AccountSelf, MaltaaAccount } from "./definitions/MaltaaAccount";
import { Preferences } from "./definitions/Preferences";

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const INFINITY_JSON = 1e8;

export function range(input: { min: number, max: number }): number[] {
    const {min, max} = input;
    return Array.from(Array(max - min)).map((_, i) => i + min)
}

export function last<T>(array: T[]): T | undefined {
    return array[array.length - 1];
}

export function sleep(timeMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            resolve();
        }, timeMs)
    })
}

// Use as filter
export function dedupe<T>(value: T, index: number, array: T[]) {
    return array.indexOf(value) === index;
}

export function dedupeById<T extends ObjectWithId>(list: T[]): T[] {
    const result: T[] = [];
    for (const item of list) {
        if (result.every(x => x.id !== item.id)) {
            result.push(item);
        }
    }
    return result;
}


export function promiseWithTimeout<T>(timeoutInMs: number, promise: Promise<T>): Promise<T> {

    const timeout: Promise<T> = new Promise((resolve, reject) => {
        const id = setTimeout(
            () => {
                clearTimeout(id);
                reject(new Error(`time out in ${timeoutInMs}`))
            },
            timeoutInMs
        );
    });

    return Promise.race([
        promise,
        timeout
    ])
}

export function readableDateTime(dateEpoch: number, hideTime = false): string {
    function dateDiffInDays(a: Date, b: Date) {
        const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
        const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

        return Math.floor((utc2 - utc1) / DAY);
    }

    function pad(n: number): string {
        return n.toString().padStart(2, "0");
    }

    const now = new Date();
    const then = new Date(dateEpoch);

    const time = hideTime ? "" : `${pad(then.getHours())}:${pad(then.getMinutes())}`;

    const diff = dateDiffInDays(then, now);
    if (+now - +then < 48 * HOUR) {
        if (diff === 0) {
            return `今日${time}`;
        } else if (diff === 1) {
            return `昨日${time}`;
        }
    }
    const monthDay = `${then.getMonth() + 1}月${then.getDate()}日`;
    if (then.getFullYear() === now.getFullYear()) {
        return monthDay;
    } else if (then.getFullYear() + 1 === now.getFullYear()) {
        return `去年` + monthDay;
    } else {
        const year = `${then.getFullYear()}年`;
        return year + monthDay;
    }
}

export function mergeArray<T extends ObjectWithId>(data: ObjectMap<T>, newData?: T[]): ObjectMap<T> {
    if (!newData) {
        return data;
    }
    const result = {...data};
    for (const datum of newData) {
        result[datum.id] = datum;
    }
    return result;
}

export function daysToMs(days: number): number {
    return days * DAY;
}

export function daysAgoInEpoch(days: number): number {
    return Date.now() - daysToMs(days);
}

export function getFallbackPreferences(): Preferences {
    return {
        version: 1,

        data: {
            screenedUsers: [],
            followedUsers: [],
        },

        styles: {
            customCSS: "",
        },

        podium: {
            defaultSort: "comments",
            defaultPeriod: 1,
            hoverPreview: true,
        },

        articles: {
            showUpstreams: true,
            showDownstreams: true,
            showMattersLink: true,
            showArticleDevInfo: false,
            appreciateMaxButton: true,
        },

        comments: {
            firstLevel: {
                sort: "old",
                displayThreshold: INFINITY_JSON,
            },
            secondLevel: {
                sort: "old",
                displayThreshold: 2,
            },
            showVotes: false,
        },

        identity: {
            operator: null,
        },

        privacy: {
            doNotTrack: null,
        },
    }
}

export function protectAccountFromSelf(account: MaltaaAccount): AccountSelf {
    return {
        id: account.id,
        username: account.username,
        privileges: account.privileges,
        mattersIds: account.mattersIds,
        preferences: account.preferences,
    }
}


export function newEmptyObject() {
    return Object.create(null);
}

export const assortmentSigil: { [key in AssortmentContentType]: string } = {
    anthology: "an",
    roll: "rl",
    mixture: "mx",
};

function reverseMap<K extends string, V extends string>(data: { [key in K]: V }): { [key in V]: K } {
    const result: any = {};
    for (const entry of Object.entries(data)) {
        const [key, value] = entry;
        result[value as any] = key;
    }
    return result;
}

export const assortmentTypes = reverseMap(assortmentSigil);

export const assortmentNames: { [key in AssortmentContentType]: string } = {
    anthology: "文選",
    roll: "名冊",
    mixture: "什錦",
}

export const assortmentEntityTypes: { [key in AssortmentContentType]: MattersEntityType[] } = {
    anthology: ["article", "comment"],
    roll: ["user"],
    mixture: ["article", "comment", "user"],
}

export function hasIntersection<T>(a?: T[], b?: T[]): boolean {
    if (!a || !b) {
        return false;
    }
    for (const item of a) {
        if (b.includes(item)) {
            return true;
        }
    }
    return false;
}

export function splinter<T>(array: T[], f: (item: T) => boolean): {yes: T[], no: T[]} {
    const yes: T[] = [];
    const no: T[] = [];
    for (const item of array) {
        if (f(item)) {
            yes.push(item);
        }
        else {
            no.push(item);
        }
    }
    return {yes, no}
}

export function filterNulls<T>(array: (T | null)[]): T[] {
    const result: T[] = [];
    for (const item of array) {
        if (item !== null) {
            result.push(item)
        }
    }
    return result;
}
