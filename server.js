const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });

let rooms = {}; // Stores active chat rooms and their users

server.on("connection", (ws, req) => {
    const params = new URLSearchParams(req.url.split("?")[1]);
    const roomId = params.get("room");

    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }

    // Check if the room already has 2 users
    if (rooms[roomId].length >= 2) {
        ws.send(JSON.stringify({ type: "error", message: "Room is full! Please create a new chat." }));
        ws.close();
        return;
    }

    rooms[roomId].push(ws);
    broadcast(roomId, { type: "userCount", count: rooms[roomId].length });

    ws.on("message", (message) => {
        const data = JSON.parse(message);
        broadcast(roomId, data, ws);
    });

    ws.on("close", () => {
        rooms[roomId] = rooms[roomId].filter(client => client !== ws);
        broadcast(roomId, { type: "message", message: "A user has left the chat." });

        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }
    });
});

function broadcast(roomId, message, sender) {
    rooms[roomId].forEach(client => {
        if (client !== sender) {
            client.send(JSON.stringify(message));
        }
    });
}

console.log("WebSocket server running on ws://localhost:3000");
