import { db } from "../db";

export async function migrate() {
    await db.connect();
    const ids = await db.user.getAllIds();
    for (const id of ids) {
        const user = (await db.user.findByIds([id]))[0];
        if (!user) {
            continue
        }
        let changed = false;
        if (typeof user.info.description !== "string") {
            user.info.description = "";
            changed = true;
        }
        if (typeof user.info.profileCover !== "string") {
            user.info.profileCover = null;
            changed = true;
        }
        if (changed) {
            await db.user.upsert(user);
        }
    }
    process.exit();
}

migrate()
