import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { watch, readFileSync } from 'fs';
import { basename } from 'path';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const port = 3000;

const template = `
<!DOCTYPE html>
<html>
<head>
    <title>Text Files Viewer</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            display: flex; 
            gap: 20px; 
            height: 100vh; 
            box-sizing: border-box;
            background: #f0f0f0;
        }
        .column { 
            flex: 1; 
            display: flex;
            flex-direction: column;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 10px;
        }
        .title {
            font-family: Arial, sans-serif;
            font-weight: bold;
            margin-bottom: 10px;
            padding: 5px;
            background: #f0f0f0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ccc;
        }
        .status-indicator.connected {
            background-color: #4CAF50;
        }
        .status-indicator.disconnected {
            background-color: #f44336;
        }
        pre { 
            flex: 1;
            overflow-y: auto;
            margin: 0;
            padding: 10px;
            font-family: monospace;
            font-size: 14px;
            border: 1px solid #ddd;
            border-radius: 4px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
    <script>
        let socket;
        let heartbeatInterval;
        let reconnectTimeout;
        const HEARTBEAT_INTERVAL = 30000; // 30 seconds
        const RECONNECT_DELAY = 3000;     // 3 seconds

        function updateConnectionStatus(connected) {
            const indicators = document.querySelectorAll('.status-indicator');
            indicators.forEach(indicator => {
                indicator.className = 'status-indicator ' + (connected ? 'connected' : 'disconnected');
            });
        }

        function connect() {
            if (socket && socket.readyState !== WebSocket.CLOSED) return;
            
            socket = new WebSocket('ws://' + window.location.host);
            
            socket.onopen = () => {
                console.log('Connected to server');
                updateConnectionStatus(true);
                
                // Start heartbeat
                clearInterval(heartbeatInterval);
                heartbeatInterval = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'ping' }));
                    }
                }, HEARTBEAT_INTERVAL);
            };
            
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'pong') return;
                    
                    if (data.test) {
                        document.getElementById('test-content').textContent = data.test;
                        console.log('Updated test.md');
                    }
                    if (data.messages) {
                        document.getElementById('messages-content').textContent = data.messages;
                        console.log('Updated messages.md');
                    }
                } catch (err) {
                    console.error('Error processing message:', err);
                }
            };
            
            socket.onclose = () => {
                console.log('Connection closed');
                updateConnectionStatus(false);
                clearInterval(heartbeatInterval);
                
                // Schedule reconnection
                clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
            };
            
            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                socket.close();
            };
        }

        // Initial connection
        window.addEventListener('load', connect);

        // Reconnect on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                connect();
            }
        });
    </script>
</head>
<body>
    <div class="column">
        <div class="title">
            test.md
            <div class="status-indicator"></div>
        </div>
        <pre id="test-content"><%= testContent %></pre>
    </div>
    <div class="column">
        <div class="title">
            messages.md
            <div class="status-indicator"></div>
        </div>
        <pre id="messages-content"><%= messagesContent %></pre>
    </div>
</body>
</html>
`;

const clients = new Set();

// Keep track of the last known content
let lastContent = {
    test: '',
    messages: ''
};

function readFileContent(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return `Error reading file: ${filePath}`;
    }
}

// Function to send content to a specific client
function sendContentToClient(ws) {
    if (ws.readyState === WebSocket.OPEN) {
        try {
            const content = {
                test: readFileContent('test.md'),
                messages: readFileContent('messages.md')
            };
            ws.send(JSON.stringify(content));
        } catch (error) {
            console.error('Error sending content to client:', error);
        }
    }
}

// Broadcast content to all clients
function broadcastContent(filename) {
    const content = {};
    
    try {
        if (filename === 'test.md' || filename === 'messages.md') {
            const newContent = readFileContent(filename);
            const key = filename === 'test.md' ? 'test' : 'messages';
            
            // Only broadcast if content has changed
            if (newContent !== lastContent[key]) {
                content[key] = newContent;
                lastContent[key] = newContent;
                
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(content));
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error broadcasting content:', error);
    }
}

// Set up file watchers
['test.md', 'messages.md'].forEach(filename => {
    let fsWait = false;
    watch(filename, (eventType) => {
        if (eventType === 'change') {
            if (fsWait) return;
            fsWait = setTimeout(() => {
                fsWait = false;
            }, 100);
            
            console.log(`${filename} changed, broadcasting...`);
            broadcastContent(filename);
        }
    });
    console.log(`Watching ${filename}`);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected, total clients:', clients.size);
    
    // Send initial content
    sendContentToClient(ws);
    
    // Set up heartbeat check
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            if (message.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected, total clients:', clients.size);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// Interval to check connection health
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            clients.delete(ws);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

// Express route
app.get('/', (req, res) => {
    const testContent = readFileContent('test.md');
    const messagesContent = readFileContent('messages.md');
    
    const finalHtml = template
        .replace('<%= testContent %>', testContent)
        .replace('<%= messagesContent %>', messagesContent);
    
    res.send(finalHtml);
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Cleanup
process.on('SIGINT', () => {
    wss.clients.forEach(client => client.terminate());
    server.close();
    process.exit();
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
