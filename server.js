const WebSocket = require("ws");

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

const gridSize = 20;
const size = 700;

const skins = [
  "#00ff00",
  "#ff0000",
  "#0000ff",
  "#ff00ff",
  "#00ffff",
  "#ffa500",
];

let players = {};
let food = randomFood();
let directions = {};

function randomFood() {
  return {
    x: Math.floor(Math.random() * (size / gridSize)) * gridSize,
    y: Math.floor(Math.random() * (size / gridSize)) * gridSize
  };
}

wss.on("connection", (ws) => {
  const id = Date.now().toString();

  players[id] = {
    snake: [{ x: 200, y: 200 }],
    color: skins[Math.floor(Math.random() * skins.length)]
  };

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

// GAME LOOP
setInterval(() => {
  for (let id in players) {
    let player = players[id];
    let snake = player.snake;
    let dir = directions[id];

    if (!dir) continue;

    let head = { ...snake[0] };
    head.x += dir.x;
    head.y += dir.y;

    // wall collision
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

}, 80);

console.log("Server running on port", port);
