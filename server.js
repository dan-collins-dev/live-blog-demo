"use strict";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getPosts() {
    try {
        const data = await fs.readFile(
            path.join(__dirname, "data", "posts.json"),
        );
        return JSON.parse(data);
    } catch (error) {
        console.error(error);
    }
}

async function savePosts(data) {
    try {
        await fs.writeFile(
            path.join(__dirname, "data", "posts.json"),
            JSON.stringify(data),
        );
    } catch (error) {
        console.error(error);
    }
}

async function createPost(title, content) {
    return {
        id: await createNewId(),
        title,
        content,
    };
}

async function createNewId() {
    const posts = await getPosts();
    const postIds = posts.map(post => post.id);
    return Math.max(...postIds) + 1;
}

app.get("/", async (request, response) => {
    const posts = await getPosts();
    response.status(200).json(posts);
});

app.get("/:id", async (request, response) => {
    if (!request.params.id) {
        return response.status(404).json({
            error: "Post with that id does not exist",
        });
    }

    try {
        const id = parseInt(request.params.id);
        const posts = await getPosts();
        const post = posts.find(post => post.id === id);

        if (!post) {
            return response.status(404).json({
                error: "Post with that id doesn't exist",
            });
        }

        response.status(200).json(post);
    } catch (error) {
        console.log(error);
    }
});

app.post("/", async (request, response) => {
    if (!request.body) {
        return response.status(400).json({
            error: "Bad request. Body is missing",
        });
    }

    if (!request.body.title || !request.body.content) {
        return response.status(400).json({
            error: "Bad Request. Missing title or content",
        });
    }

    try {
        const newPost = await createPost(
            request.body.title,
            request.body.content,
        );

        const posts = await getPosts();
        posts.push(newPost);
        await savePosts(posts);

        return response.status(201).json(newPost);
    } catch (error) {
        console.error(error.message);
    }
});

app.put("/:id", async (request, response) => {
    if (!request.params.id) {
        return response.status(404).json({
            error: "Post with that id does not exist",
        });
    }

    try {
        const id = parseInt(request.params.id);
        const posts = await getPosts();
        const post = posts.find(post => post.id === id);

        if (!post) {
            return response.status(404).json({
                error: "Post with that id does not exist",
            });
        }

        if (!request.body.title || !request.body.content) {
            return response.status(400).json({
                error: "Bad Request. Missing title or content",
            });
        }

        post.title = request.body.title;
        post.content = request.body.content;

        await savePosts(posts);

        response.status(200).json(post);
    } catch (error) {
        console.error(error.message);
    }
});

app.delete("/:id", async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        let posts = await getPosts();
        const post = posts.find(post => post.id === id);

        if (!post) {
            return response.status(404).json({
                error: "Post with that id does not exist",
            });
        }

        posts = posts.filter(post => post.id !== id);
        await savePosts(posts);

        response.status(204).json();
    } catch (error) {
        console.error(error.message);
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log("Press ctrl+c to end this process");
});
