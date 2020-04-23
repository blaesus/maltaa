import { THREAD_PREFIX } from "./settings";
import { articleSerialToId } from "./mattersSpecifics";

export function threadSubpathToSerial(subpath: string): number {
    return Number.parseInt(subpath.replace(THREAD_PREFIX, ""), 10)
}

export function isThreadSubpath(s: string): boolean {
    return s.startsWith(THREAD_PREFIX) && threadSubpathToSerial(s) > 0;
}

export function threadSubpathToMattersArticleId(subpath: string, bota: (s: string) => string): string {
    const serial = threadSubpathToSerial(subpath);
    return articleSerialToId(serial, bota)
}