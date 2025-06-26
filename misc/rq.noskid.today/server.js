const express = require('express');
const WebSocket = require('ws');
const NskdLbr = require('nskd-lbr');

const PORT = process.argv[2] || 3000;
const MAX_SESSIONS = 1000;

function getRequesterIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const forwardedIps = xff.split(',').map(ip => ip.trim());
    const firstIp = forwardedIps.find(ip => /^[\d.:]+$/.test(ip));
    if (firstIp) return firstIp;
  }
  return req.connection.remoteAddress || req.socket.remoteAddress || '0.0.0.0';
}

const app = express();
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });
const sessions = new Map();
const noskid = new NskdLbr();

wss.on('connection', (ws) => {
  let sessionId = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'auth' && data.key) {
        try {
          const result = await noskid.verifyWithKey(data.key);

          if (result.valid && sessions.size < MAX_SESSIONS) {
            sessionId = generateSessionId();
            const requestUrl = `/r/${sessionId}`;

            sessions.set(sessionId, ws);
            ws.send(JSON.stringify({
              type: 'auth_success',
              url: requestUrl
            }));

            console.log(`New session created: ${sessionId}`);
          } else {
            const reason = sessions.size >= MAX_SESSIONS ?
              'Maximum sessions reached' : 'Invalid auth key';
            ws.send(JSON.stringify({
              type: 'auth_failed',
              reason: reason
            }));
            ws.close();
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'auth_error',
            message: error.message
          }));
          ws.close();
        }
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    if (sessionId) {
      sessions.delete(sessionId);
      console.log(`Session closed: ${sessionId}`);
    }
  });
});

function generateSessionId() {
  return Math.random().toString(36).substring(2, 5);
}

function sendToSession(sessionId, data) {
  const ws = sessions.get(sessionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

app.use(express.json());

app.all('/r/:id', async (req, res) => {
  const sessionId = req.params.id;
  const ws = sessions.get(sessionId);
  const requestInfo = {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    ip: getRequesterIp(req),
    timestamp: new Date().toISOString(),
    url: req.originalUrl
  };

  sendToSession(sessionId, {
    type: 'request_data',
    data: requestInfo
  });

  res.redirect(301, `https://light.noskid.today/`);
  }
);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    activeSessions: sessions.size,
    maxSessions: MAX_SESSIONS
  });
});

app.get('/', (req, res) => {
  res.redirect(301, 'https://noskid.today/');
});
