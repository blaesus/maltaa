import * as fs from "fs";
import * as path from "path";
import {promisify} from "util";
import { db } from "./db";

const readdirAsync = promisify(fs.readdir);

async function applyMigrations() {
    await db.connect();
    const dataStatus = await db.dataStatus.getWithFallback();
    const migrationsPath = path.join(__dirname, "migrations");
    const filePaths = await readdirAsync(migrationsPath);
    const migrationScriptPaths = filePaths.filter(f => f.endsWith(".js"));
    for (const scriptPath of migrationScriptPaths) {
        if (!dataStatus.appliedMigrations[scriptPath]) {
            try {
                console.info(`Applying migration ${scriptPath}`);
                const fullPath = path.join(migrationsPath, scriptPath);
                const migrate = require(fullPath);
                await migrate.default();
                dataStatus.appliedMigrations[scriptPath] = Date.now();
                await db.dataStatus.set(dataStatus);
            }
            catch (error) {
                console.error(`Migration error`, error);
            }
        }
        else {
            console.info(`Skipping migration ${scriptPath}`);
        }
    }
    await db.close();
    process.exit();
}

applyMigrations();
