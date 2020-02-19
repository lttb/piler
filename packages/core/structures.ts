import nanoid from "nanoid";

import { Collection } from "./types";

type Action = { type: string; payload: any; meta?: object };

const declareAction = (name, method, task) => {
    const type = [name, method, task].join("/");

    const actionCreator = (payload, meta) => {
        const action: Action = { type, payload };
        if (meta) action.meta = meta;
        return action;
    };

    actionCreator.toString = () => type;

    return actionCreator;
};

const createActions = (name, method) => {
    const actions = {
        request: declareAction(name, method, "request"),
        resolve: declareAction(name, method, "resolve"),
        reject: declareAction(name, method, "reject")
    };

    return actions;
};

const actions = {
    create: createActions(`@piler`, "create"),
    get: createActions(`@piler`, "get"),
    update: createActions(`@piler`, "update"),
    replace: createActions(`@piler`, "replace"),
    remove: createActions(`@piler`, "remove"),
    destroy: createActions(`@piler`, "destroy")
};

export const createReducer = reducer =>
    reducer
        .on([actions.create.request, actions.destroy.request], () => {})
        .on(
            [
                actions.get.request,
                actions.replace.request,
                actions.update.request,
                actions.remove.request
            ],
            (collection, payload, cb) => {
                if (Array.isArray(payload.data)) {
                    for (let id of payload.data) {
                        cb(id);
                    }
                } else {
                    for (let id in payload.data) {
                        cb(id);
                    }
                }
            }
        )
        .on(
            [
                actions.create.resolve,
                actions.get.resolve,
                actions.replace.resolve
            ],
            (collection, payload, cb) => {
                for (let id in payload.data) {
                    collection[id] = payload.data[id];
                    cb(id);
                }
            }
        )
        .on([actions.update.resolve], (collection, payload, cb) => {
            for (let id in payload.data) {
                collection[id] = Object.assign(
                    collection[id] || {},
                    payload.data[id]
                );
                cb(id);
            }
        })
        .on([actions.remove.resolve], (collection, payload, cb) => {
            for (let id of [].concat(payload.data)) {
                delete collection[id];
                cb(id);
            }
        });

const createActionEffect = ({ type, key, api }) => async ({
    method,
    data,
    meta,
    store
}) => {
    const { dispatch } = store;

    api = typeof api === "function" ? api() : api || {};
    dispatch(
        actions[method].request(
            {
                task: "request",
                method,
                type,
                key,
                data
            },
            meta
        )
    );
    let nextData = data;
    if (api[method]) {
        try {
            nextData = await api[method](data, { meta, dispatch });
        } catch (error) {
            dispatch(
                actions[method].error(
                    {
                        task: "error",
                        method,
                        type,
                        key,
                        error
                    },
                    meta
                )
            );
            throw error;
        }
    }
    dispatch(
        actions[method].resolve(
            {
                task: "resolve",
                method,
                type,
                key,
                data: nextData
            },
            meta
        )
    );
    return nextData;
};

const createStructure = ({ api, key, type }) => {
    const path = [type, key].join("/");

    return {
        type,
        key,
        path,
        action: createActionEffect({ type, key, api })
    };
};

export function createCollection<T>(api): Collection<T> {
    const key = nanoid();
    const type = "collection";
    return createStructure({ api, key, type }) as any;
}

export function createModel<T>(api) {
    const key = nanoid();
    const type = "model";
    return createStructure({ api, key, type });
}
