import { Collection } from "./types";

export class Store {
    reducers = {};
    state = {};
    pending = {};
    subscribers = {};

    PENDING = new WeakSet();

    createOperator = method => <T>(
        structure: Collection<T>,
        data = undefined,
        meta = undefined
    ) => {
        if (!structure) {
            return;
        }

        return (structure as any).action({ method, data, meta, store: this });
    };

    create = this.createOperator("create");
    get = this.createOperator("get");
    update = this.createOperator("update");
    replace = this.createOperator("replace");
    remove = this.createOperator("remove");
    destroy = this.createOperator("destroy");

    getStatus = data => {
        if (data === null || data === undefined) return "UNSET";

        return this.PENDING.has(data) ? "PENDING" : "FULFILLED";
    };

    constructor(cb) {
        const fn = {
            on: (keys, reducer) => {
                keys.forEach(key => {
                    this.reducers[key] = reducer;
                });
                return fn;
            }
        };
        cb(fn);
    }

    setLinks(links, cb) {
        if (Array.isArray(links)) {
            links.forEach(x => this.setLinks(x, cb));
        } else {
            this.subscribers[links] = this.subscribers[links] || new Set();
            this.subscribers[links].add(cb);
        }
    }

    removeLinks(links, cb) {
        if (Array.isArray(links)) {
            links.forEach(x => this.removeLinks(x, cb));
        } else {
            if (!this.subscribers[links]) return;
            this.subscribers[links].delete(cb);
            if (this.subscribers[links].size === 0) {
                delete this.subscribers[links];
            }
        }
    }

    emitLink(link, data) {
        const id = link.join("/");
        this.state[id] = data;
        if (!this.subscribers[id]) return;
        this.subscribers[id].forEach(cb => {
            cb(data);
        });
    }

    subscribe(link, cb) {
        const id = link.join("/");

        this.setLinks(id, cb);

        if (this.state[id]) {
            cb(this.state[id]);
        }

        const unsubscribe = () => {
            this.removeLinks(id, cb);
        };

        return { unsubscribe };
    }

    dispatch = action => {
        if (!(action.type in this.reducers)) return;

        const { type, key, task, method } = action.payload;
        const reducer = this.reducers[action.type];

        const updated = [];

        this.state[type] = this.state[type] || {};

        const state = (this.state[type][key] = this.state[type][key] || {});

        if (task === "request") {
            this.PENDING.add(state);
        } else {
            this.PENDING.delete(state);
        }

        reducer(state, action.payload, id => {
            if (!id) return;

            if (task === "request") {
                this.PENDING.add(state[id]);
            } else {
                this.PENDING.delete(state[id]);
            }

            updated.push(id);
        });

        if (method === "destroy") {
            delete this.state[type][key];
        }

        this.emitLink([type], this.state[type]);
        this.emitLink([type, key], this.state[type][key]);

        updated.forEach(id => {
            this.emitLink([type, key, id], this.state[type][key][id]);
        });
    };
}
