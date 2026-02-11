"use strict";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const app = express();
const port = 8080;

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

function createPost(title, content) {
    return {
        id: createNewId(),
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
            return response.status(400).json({
                error: "Bad Request",
            });
        }

        response.status(200).json(post);
    } catch (error) {
        console.log(error);
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log("Press ctrl+c to end this process");
});
