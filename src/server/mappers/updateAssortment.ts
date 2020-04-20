import { db } from "../db";

import { MaltaaAction, UpdateAssortment } from "../../definitions/Actions";
import { AssortmentIdentifier, MattersEntityItem } from "../../definitions/Assortment";
import { hasIntersection } from "../../utils";
import { authenticateOperator } from "../authenticateOperator";

export async function updateAssortment(request: UpdateAssortment): Promise<MaltaaAction> {
    const auth = await authenticateOperator(request);
    if (!auth) {
        return {
            type: "GenericError",
            reason: "Authorization failed",
        };
    }
    const {account, operator} = auth;
    const target = await db.assortment.findById(request.target);
    if (!target) {
        return {
            type: "GenericError",
            reason: "Can't find it",
        };
    }
    if (request.operation === "SetPolicy") {
        if (!hasIntersection([target.owner], account.mattersIds)) {
            return {
                type: "GenericError",
                reason: "Not authorized to set archive",
            };
        }
        target.policy = request.policy
        await db.assortment.upsert(target);
        return {
            type: "ProvideEntities",
            data: {
                assortments: [target],
            },
        };
    }
    if (target.policy.archived) {
        return {
            type: "GenericError",
            reason: "Target is archived",
        };
    }
    if (!hasIntersection(target.editors, account.mattersIds)) {
        return {
            type: "GenericError",
            reason: "Can't edit",
        };
    }
    switch (request.operation) {
        case "AddItem": {
            if (target.items.some(item => item.id === request.item.id)) {
                return {
                    type: "GenericError",
                    reason: "Cannot add duplicated item",
                };
            }
            const now = Date.now();
            const newItem: MattersEntityItem = {
                source: "matters",
                entityType: request.item.entityType,
                id: request.item.id,
                review: request.item.review,
                collector: operator,
                collectionTime: now,
                lastReviewer: operator,
                lastReviewTime: now,
            };
            target.items.push(newItem);
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            };
        }
        case "DropItem": {
            target.items = target.items.filter(item => item.id !== request.itemId);
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            }
        }
        case "OrderItems": {
            target.items = target.items.sort(
                (itemA, itemB) =>
                    request.items.indexOf(itemA.id) - request.items.indexOf(itemB.id),
            );
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            };
        }
        case "EditReview": {
            const targetItemIndex = target.items.findIndex(item => item.id === request.targetItemId);
            if (targetItemIndex === -1) {
                return {
                    type: "GenericError",
                    reason: "Can't find target item",
                };
            }
            const originalItem = target.items[targetItemIndex];
            target.items[targetItemIndex] = {
                ...originalItem,
                review: request.review,
                lastReviewer: operator,
                lastReviewTime: Date.now(),
            };
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            };
        }
        case "EditTitle": {
            target.title = request.title;
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            }
        }
        case "EditSubpath": {
            const newIdentifier: AssortmentIdentifier = {
                owner: target.owner,
                contentType: target.contentType,
                subpath: request.subpath,
            };
            const existing = await db.assortment.findByIdentifier(newIdentifier);
            if (existing) {
                return {
                    type: "GenericError",
                    reason: "Identifier taken",
                }
            }
            target.subpath = request.subpath;
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            }
        }
        case "EditUpstreams": {
            target.upstreams = request.upstreams;
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            }
        }
        case "SyncFromUpstreams": {
            const upstreams = await db.assortment.findByUpstreams(target.upstreams);
            for (const upstream of upstreams) {
                target.items = [...target.items, ...upstream.items]
            }
            await db.assortment.upsert(target);
            return {
                type: "ProvideEntities",
                data: {
                    assortments: [target],
                },
            }
        }
        default: {
            return {
                type: "GenericError",
                reason: "Unknown operation",
            };
        }
    }
}