import { createReducer } from "./structures";
import { Store } from "./store";

export const store = new Store(createReducer);

export const {
    create,
    get,
    update,
    replace,
    remove,
    destroy,
    getStatus
} = store;

export * from "./structures";
export * from "./store";
export * from "./types";
