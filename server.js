const WebSocket = require("ws");

const port = process.env.PORT || 8080; // <-- REQUIRED FOR RAILWAY
const wss = new WebSocket.Server({ port });

const box = 20;
let players = {};
let food = randomFood();

function randomFood() {
    return {
        x: Math.floor(Math.random() * 20) * box,
        y: Math.floor(Math.random() * 20) * box
    };
}

wss.on("connection", ws => {
    const id = Date.now().toString();

    players[id] = [{
        x: 200,
        y: 200
    }];

    ws.send(JSON.stringify({ type: "init", id }));

    ws.on("message", msg => {
        const data = JSON.parse(msg);

        if (data.type === "dir") {
            const snake = players[id];
            if (!snake) return;

            let head = { ...snake[0] };

            if (data.key === "ArrowUp") head.y -= box;
            if (data.key === "ArrowDown") head.y += box;
            if (data.key === "ArrowLeft") head.x -= box;
            if (data.key === "ArrowRight") head.x += box;

            snake.unshift(head);

            // food
            if (head.x === food.x && head.y === food.y) {
                food = randomFood();
            } else {
                snake.pop();
            }
        }
    });

    ws.on("close", () => {
        delete players[id];
    });
});

// broadcast loop
setInterval(() => {
    const state = {
        type: "state",
        players,
        food
    };

    const msg = JSON.stringify(state);
    wss.clients.forEach(ws => ws.send(msg));
}, 120);

console.log("WebSocket server running on port " + port);