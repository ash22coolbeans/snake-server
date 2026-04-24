const WebSocket = require("ws");

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

const gridSize = 20;
const size = 700;

let players = {};
let food = randomFood();

function randomFood() {
    return {
        x: Math.floor(Math.random() * (size / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (size / gridSize)) * gridSize
    };
}

// directions stored per player
const directions = {};

wss.on("connection", (ws) => {
    const id = Date.now().toString();

    players[id] = [{ x: 200, y: 200 }];
    directions[id] = { x: 0, y: 0 };

    ws.send(JSON.stringify({ type: "init", id }));

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "dir") {
            const key = data.key;

            if (key === "ArrowUp") directions[id] = { x: 0, y: -gridSize };
            if (key === "ArrowDown") directions[id] = { x: 0, y: gridSize };
            if (key === "ArrowLeft") directions[id] = { x: -gridSize, y: 0 };
            if (key === "ArrowRight") directions[id] = { x: gridSize, y: 0 };
        }
    });

    ws.on("close", () => {
        delete players[id];
        delete directions[id];
    });
});

// GAME LOOP (THIS FIXES EVERYTHING)
setInterval(() => {
    for (let id in players) {
        let snake = players[id];
        let dir = directions[id];

        if (!dir) continue;

        let head = { ...snake[0] };
        head.x += dir.x;
        head.y += dir.y;

        // 🟥 WALL COLLISION FIX
        if (
            head.x < 0 || head.x >= size ||
            head.y < 0 || head.y >= size
        ) {
            snake.length = 1;
            snake[0] = { x: 200, y: 200 };
            directions[id] = { x: 0, y: 0 };
            continue;
        }

        snake.unshift(head);

        // food
        if (head.x === food.x && head.y === food.y) {
            food = randomFood();
        } else {
            snake.pop();
        }
    }

    const state = JSON.stringify({
        type: "state",
        players,
        food
    });

    wss.clients.forEach(ws => ws.send(state));

}, 120);

console.log("Server running on port", port);
