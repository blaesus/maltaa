import { db } from "./db";
import { DAY } from "../utils";
async function gen() {
    await db.connect();
    let start = +new Date(2018, 9, 1)
    const end = start + 90 * DAY
    while (start < end) {
        const comments = await db.comment.countBetween(start, start + DAY);
        const date = new Date(start);
        console.info(date.toISOString().slice(0, 10), comments);
        start += DAY;
    }
    process.exit();
}

gen()