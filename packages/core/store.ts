import { PENDING } from "./operators";

export class Store {
    reducers = {};
    state = {};
    pending = {};
    subscribers = {};

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

        const { type, key, task } = action.payload;
        const reducer = this.reducers[action.type];

        const updated = [];

        this.state[type] = this.state[type] || {};

        const state = (this.state[type][key] = this.state[type][key] || {});

        if (task === "request") {
            PENDING.add(state);
        } else {
            PENDING.delete(state);
        }

        reducer(state, action.payload, id => {
            if (!id) return;

            if (task === "request") {
                PENDING.add(state[id]);
            } else {
                PENDING.delete(state[id]);
            }

            updated.push(id);
        });

        this.emitLink([type], this.state[type]);
        this.emitLink([type, key], this.state[type][key]);

        updated.forEach(id => {
            this.emitLink([type, key, id], this.state[type][key][id]);
        });
    };
}
