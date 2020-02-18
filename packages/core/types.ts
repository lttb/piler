export type Collection<T> = { [key: string]: T } & {
    readonly __private__: unique symbol;
};

export type Model<T> = T & { readonly __private__: unique symbol };
