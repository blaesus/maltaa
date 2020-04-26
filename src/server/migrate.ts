import * as fs from "fs";
import * as path from "path";
import {promisify} from "util";
import { db } from "./db";

const readdirAsync = promisify(fs.readdir);

async function applyMigrations() {
    await db.connect();
    console.info(__dirname)
    const migrationsPath = path.join(__dirname, "migrations");
    const filePaths = await readdirAsync(migrationsPath);
    const migrationScriptPaths = filePaths.filter(f => f.endsWith(".js"));
    for (const scriptPath of migrationScriptPaths) {
        const fullPath = path.join(migrationsPath, scriptPath);
        const migrate = require(fullPath);
        const dataStatus = await db.dataStatus.getWithFallback();
        await migrate.default();
        dataStatus.appliedMigrations[scriptPath] = Date.now();
        await db.dataStatus.set(dataStatus);
    }
    await db.close();
    process.exit();
}

applyMigrations();
