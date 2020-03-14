import * as Koa from "koa";
import * as KoaRouter from "koa-router";
import { db } from "./db";

async function main() {
    await db.connect();

    const app = new Koa();
    app.proxy = true;

    const router = new KoaRouter();
    router.prefix("/api");

    router.get("/user/:id", async (context, next) => {
        const userId = context.params.id;
        const users = await db.user.findByIds([userId]);
        if (users[0]) {
            context.status = 200;
            context.body = users[0];
        }
        else {
            context.status = 404;
        }
        return next();
    });

    app.use(router.routes())
       .use(router.allowedMethods());

    app.listen(2000);
}

!!main();
