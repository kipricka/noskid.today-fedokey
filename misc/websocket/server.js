const WebSocket = require('ws');
const port = 8057;
const wss = new WebSocket.Server({ port: port });

let clients = new Set();
let bannedClients = new Map();
let healthCheckTimers = new Map();

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
        'info': '\x1b[37m',
        'success': '\x1b[32m\x1b[1m',
        'warning': '\x1b[33m',
        'error': '\x1b[31m\x1b[1m',
        'reset': '\x1b[0m'
    };

    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function displayLogo() {
    console.log('\x1b[36m');
    console.log('----------- NoSkid WebSocket -----------');
    console.log('|- Avalible at wss://ws.noskid.today !-|');
    console.log('|-         Made by @douxxtech         -|');
    console.log('---------------------------------------');
    console.log('\x1b[0m');
    console.log();
}

setInterval(() => {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            const clientIP = client.realIP || client._socket.remoteAddress;
            client.send(JSON.stringify({ type: 'healthcheck', data: 'ping' }));

            const timer = setTimeout(() => {
                if (client.readyState === WebSocket.OPEN) {
                    log(`Client ${clientIP} did not respond to healthcheck in time`, 'warning');
                    client.close(1008, 'Did not respond to healthcheck in time');
                }
            }, 1000);

            healthCheckTimers.set(client, timer);
        }
    });
}, 30000);

wss.on('listening', () => {
    displayLogo();
});

wss.on('connection', (ws, req) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    ws.realIP = clientIP;


    if (clients.size >= 50) {
        log(`Connection refused: server full (50 clients max). Attempt from ${clientIP}`, 'warning');
        ws.close(1013, 'Server is full. Try again later.');
        return;
    }

    log(`New connection attempt from: ${clientIP}`, 'info');

    if (bannedClients.has(clientIP)) {
        const banTime = bannedClients.get(clientIP);
        if (banTime > Date.now()) {
            log(`Connection refused: ${clientIP} is banned until ${new Date(banTime)}`, 'warning');
            ws.close(1008, 'You are temporarily banned for sending malformed data');
            return;
        } else {
            bannedClients.delete(clientIP);
        }
    }

    ws.send(JSON.stringify({ type: 'auth', message: 'we hate...' }));

    let isAuthenticated = false;

    ws.on('message', (message) => {
        if (!isAuthenticated) {
            try {
                const data = JSON.parse(message);
                if (data.type === 'auth' && data.response === 'skids') {
                    isAuthenticated = true;
                    clients.add(ws);
                    log(`Client authenticated and connected: ${clientIP} (Total clients: ${clients.size})`, 'success');
                    return;
                } else {
                    ws.close(1008, 'Authentication failed');
                    return;
                }
            } catch (e) {
                ws.close(1008, 'Authentication failed');
                return;
            }
        }

        try {
            const data = JSON.parse(message);
            if (data.type === 'healthcheck' && data.data === 'pong') {
                if (healthCheckTimers.has(ws)) {
                    clearTimeout(healthCheckTimers.get(ws));
                    healthCheckTimers.delete(ws);
                }
                return;
            }

            if (!data.id || typeof data.x !== 'number' || typeof data.y !== 'number') {
                throw new Error('Malformed data');
            }

            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message.toString());
                }
            });
        } catch (err) {
            log(`Invalid data from ${clientIP}: ${err.message}`, 'error');
            bannedClients.set(clientIP, Date.now() + 300000);
            ws.close(1008, 'You sent malformed data and have been temporarily banned');
        }
    });

    ws.on('close', () => {
        if (isAuthenticated) {
            clients.delete(ws);
            if (healthCheckTimers.has(ws)) {
                clearTimeout(healthCheckTimers.get(ws));
                healthCheckTimers.delete(ws);
            }
            log(`Client disconnected: ${clientIP} (Total clients: ${clients.size})`, 'warning');
        }
    });

    ws.on('error', (err) => {
        log(`WebSocket error from ${clientIP}: ${err.message}`, 'error');
    });
});
