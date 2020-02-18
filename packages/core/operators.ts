import { Collection } from "./types";

export const PENDING = new WeakSet();

const createOperator = method => <T>(
    structure: Collection<T>,
    data = undefined,
    meta = undefined
) => {
    if (!structure) {
        return;
    }

    return structure.action({ method, data, meta });
};

export const create = createOperator("create");
export const get = createOperator("get");
export const update = createOperator("update");
export const replace = createOperator("replace");
export const remove = createOperator("remove");

export const getStatus = data => {
    if (data === null || data === undefined) return "UNSET";

    return PENDING.has(data) ? "PENDING" : "FULFILLED";
};
