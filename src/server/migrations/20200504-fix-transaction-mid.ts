import { db } from "../db";

const seenCreateTime: {[key in number]: boolean} = {};

async function migrate() {
    const txIds = await db.transaction.getAllIds();
    let index = 0;
    for (const id of txIds) {
        const tx = await db.transaction.internal.findByMid(id.mid);
        if (tx && tx.createdAt && !seenCreateTime[tx.createdAt]) {
            await db.transaction.internal.deleteByCreatedAt(tx.createdAt);
            tx.mid = `${tx.target}_${tx.sender}`;
            await db.transaction.upsert(tx);
            seenCreateTime[tx.createdAt] = true;
        }
        if (index % 100 === 0) {
            console.info(`${index}/${txIds.length}`)
        }
        index++;
    }
}

export default migrate;