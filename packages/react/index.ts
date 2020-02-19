import React from "react";
import nanoid from "nanoid";

import { Collection, store } from "@piler/core";

function useCollection<C, K extends string>(
    collection: Collection<C>,
    id: K
): C;
function useCollection<C>(collection: Collection<C>): { [key: string]: C };

function useCollection<C>(collection: Collection<C>, id?: keyof C) {
    const { path } = collection as any;

    const ref = React.useRef();
    const [state, setState] = React.useState({ data: null });

    React.useEffect(() => {
        let sub;

        sub = store.subscribe([path, ...(id ? [id] : [])], data => {
            setState({ data });
        });

        return () => sub.unsubscribe();
    }, [id]);

    return state.data;
}

export { useCollection };
