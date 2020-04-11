import * as fetch from "isomorphic-fetch"
import { SPIDER_COMMAND_PORT } from "./server-configs";

export const spiderCommander = {
    async addArticle(id: string) {
        await fetch(`http://localhost:${SPIDER_COMMAND_PORT}/api/spider/articles/${id}`, {
            method: "POST",
        })
    }
};

