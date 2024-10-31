// server.js
import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream('cli-display.html').pipe(res);
  }
});

const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Set();

// WebSocket server handlers
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected');

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

// Function to broadcast updates to all connected clients
function broadcastUpdate(type, data) {
  const message = JSON.stringify({ type, data });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

server.listen(3030, () => {
  console.log('Server running on http://localhost:3030');
});

export { broadcastUpdate };
