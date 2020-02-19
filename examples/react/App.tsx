import React from "react";

import {
    update,
    get,
    create,
    destroy,
    createCollection,
    getStatus
} from "@piler/core";
import { useCollection } from "@piler/react";

import nanoid from "nanoid";

const $$posts = createCollection<{
    id: string;
    title: string;
}>({
    create: data =>
        new Promise(resolve =>
            setTimeout(() => {
                const id = data.id || nanoid();
                resolve({
                    [id]: { ...data, id }
                });
            }, 500)
        ),

    update: data => new Promise(resolve => setTimeout(() => resolve(data), 500))
});

async function createPost() {
    await create($$posts, {
        title: "create hello!" + Math.random()
    });

    console.log("created");
}

async function updatePost(e) {
    const id = e.currentTarget.dataset.id;

    await update($$posts, {
        [id]: {
            title: "update hello!" + Math.random()
        }
    });

    console.log("updated");
}

const Posts = () => {
    const posts = useCollection($$posts) || {};

    return (
        <>
            <button onClick={createPost}>create post</button>
            <button
                onClick={() => {
                    destroy($$posts);
                }}
            >
                destroy
            </button>

            <h2>posts ({getStatus(posts)}):</h2>

            {Object.values(posts).map(post => {
                if (!post) return null;

                return (
                    <div style={{ margin: "50px 0" }} key={post.id}>
                        <div>title: {post.title}</div>
                        <div>id: {post.id}</div>
                        <div>status: {getStatus(post)}</div>
                        <div>
                            <button onClick={updatePost} data-id={post.id}>
                                update post
                            </button>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default function App() {
    return (
        <div>
            <Posts />
        </div>
    );
}
