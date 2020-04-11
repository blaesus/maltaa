import { randomBytes } from "crypto";

export const btoa = (s: string) => Buffer.from(s).toString("base64");
export const atob = (s: string) => Buffer.from(s, "base64").toString();

export function randomString(bytes: number): string {
    return randomBytes(bytes).toString("hex")
}
