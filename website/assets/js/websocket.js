//Websocket.js | WebSocket client for cursor tracking and interaction

let socket = null;
let isWebSocketActive = false;
let canvas = null;
let ctx = null;
let W, H;
let trail = [];
let cursors = new Map();
let clientId = Math.random().toString(36).substring(2);
let mouseX = 0;
let mouseY = 0;
let isMoving = false;
let lastMovementTime = 0;
let lastSend = 0;
let cursorImage = null;
let cursorImageLoaded = false;
let lastActivityTime = Date.now();
const INACTIVITY_THRESHOLD = 5000;
const cursorSize = 38;
const wsurl = 'wss://ws.noskid.today';

function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'cursorTrailCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    loadCursorImage();
    log('Canvas initialized', 'success');
}

function loadCursorImage() {
    cursorImage = new Image();
    cursorImage.src = 'assets/img/cursor_white.png';
    cursorImage.onload = function () {
        cursorImageLoaded = true;
        log('Cursor image loaded successfully', 'success');
    };
    cursorImage.onerror = function () {
        console.error("Failed to load cursor image, using default cursor");
        cursorImageLoaded = false;
        log('Failed to load cursor image, using default cursor', 'warning');
    };
}

function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    log(`Canvas resized to ${W}x${H}`, 'info');
}

function toggleWebSocketMode() {
    if (isWebSocketActive) {
        if (socket) {
            socket.close();
            socket = null;
        }
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        isWebSocketActive = false;
        log('WebSocket mode deactivated', 'warning');
    } else {
        initCanvas();
        setupWebSocket();
        document.addEventListener('mousemove', handleMouseMove);
        isWebSocketActive = true;
        log('WebSocket mode activated', 'success');
        requestAnimationFrame(draw);
    }
}

function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMoving = true;
    lastMovementTime = Date.now();
    lastActivityTime = Date.now();
    addTrailPoint(mouseX, mouseY);
    sendPosition();
}

function addTrailPoint(x, y) {
    trail.push({ x, y, time: Date.now() });
    if (trail.length > 20) {
        trail.shift();
    }
}

function sendPosition() {
    const now = Date.now();
    if (now - lastSend < 30 || !socket || socket.readyState !== WebSocket.OPEN) return;
    lastSend = now;

    const data = {
        id: clientId,
        x: mouseX,
        y: mouseY,
    };
    try {
        socket.send(JSON.stringify(data));
    } catch (e) {
        console.error("Error sending WebSocket message:", e);
        log('Error sending WebSocket message: ' + e.message, 'error');
    }
}

function checkInactivity() {
    const now = Date.now();
    if (now - lastActivityTime > INACTIVITY_THRESHOLD) {
        return true;
    }
    return false;
}

function setupWebSocket() {
    socket = new WebSocket(wsurl);

    socket.addEventListener('open', () => {
        log("WebSocket connection established", 'success');
        showNotification('WebSocket connection established');
    });

    socket.addEventListener('close', (event) => {
        if (event.code === 1008) {
            const reason = event.reason || "You are temporarily banned";
            log(`Connection closed: code=${event.code}, reason=${reason}`, 'error');
            showNotification(`Temporarily banned: ${reason}`);
        } else if (event.code === 1013) {
            log(`Connection closed: code=${event.code}, reason=Server is full`, 'error');
            showNotification(`Server is full, try again later`);
        } else {
            log(`WebSocket connection closed: code=${event.code}`, 'warning');
            showNotification('WebSocket connection closed');
        }
    });

    socket.addEventListener('error', (error) => {
        console.error("WebSocket error:", error);
        log("WebSocket error: " + error.message, 'error');
        showNotification('WebSocket error: ' + error.message);
    });

    socket.addEventListener('message', async (event) => {
        try {
            let data;
            if (typeof event.data === 'string') {
                data = JSON.parse(event.data);
            } else if (event.data instanceof Blob) {
                const text = await event.data.text();
                data = JSON.parse(text);
            } else {
                log("Unknown message format: " + event.data, 'warning');
                return;
            }

            if (data.type === 'auth') {
                socket.send(JSON.stringify({ type: 'auth', response: 'skids' }));
                log('Authentication message received', 'info');
                return;
            }

            if (data.type === 'healthcheck') {
                socket.send(JSON.stringify({ type: 'healthcheck', data: 'pong' }));
                log('Healthcheck message received', 'info');
                return;
            }

            if (data.id) {
                lastActivityTime = Date.now();
                if (data.id !== clientId) {
                    let cursor = cursors.get(data.id);
                    if (!cursor) {
                        cursor = {
                            x: data.x,
                            y: data.y,
                            trail: [],
                        };
                        cursors.set(data.id, cursor);
                        log(`New cursor detected with ID: ${data.id}`, 'info');
                        addAchievement('Websocket Socializer');
                    } else {
                        cursor.x = data.x;
                        cursor.y = data.y;
                    }

                    cursor.trail.push({ x: data.x, y: data.y, time: Date.now() });
                    if (cursor.trail.length > 20) {
                        cursor.trail.shift();
                    }
                }
            }
        } catch (err) {
            console.error('Error processing message:', err);
            log('Error processing message: ' + err.message, 'error');
        }
    });
}

function drawTrail(points, alphaMultiplier = 1) {
    if (!points || points.length < 2) return;

    for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const progress = i / points.length;
        const thickness = 12 * (0.3 + progress * 0.7);
        let alpha = (0.4 + (progress * 0.5)) * alphaMultiplier;
        alpha = Math.max(0, alpha);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.stroke();
    }

    if (points.length > 1) {
        const firstPoint = points[0];
        const secondPoint = points[1];
        const angle = Math.atan2(secondPoint.y - firstPoint.y, secondPoint.x - firstPoint.x);

        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);
        const tipLength = 12 * 1.2;
        const tipWidth = 12 * 0.6;

        ctx.lineTo(
            firstPoint.x - Math.cos(angle) * tipLength + Math.sin(angle) * tipWidth,
            firstPoint.y - Math.sin(angle) * tipLength - Math.cos(angle) * tipWidth
        );

        ctx.moveTo(firstPoint.x, firstPoint.y);
        ctx.lineTo(
            firstPoint.x - Math.cos(angle) * tipLength - Math.sin(angle) * tipWidth,
            firstPoint.y - Math.sin(angle) * tipLength + Math.cos(angle) * tipWidth
        );

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * alphaMultiplier})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function drawCursors(alphaMultiplier) {
    cursors.forEach((cursor) => {
        if (cursor.trail.length > 1) {
            drawTrail(cursor.trail, alphaMultiplier);
        }

        if (cursorImageLoaded && cursorImage) {
            try {
                const offsetX = 15;
                const offsetY = 15;
                ctx.globalAlpha = alphaMultiplier;
                ctx.drawImage(
                    cursorImage,
                    cursor.x - cursorSize / 2 + offsetX,
                    cursor.y - cursorSize / 2 + offsetY,
                    cursorSize,
                    cursorSize
                );
                ctx.globalAlpha = 1;
            } catch (e) {
                console.error("Error drawing cursor image:", e);
                log('Error drawing cursor image: ' + e.message, 'error');
                ctx.globalAlpha = alphaMultiplier;
                ctx.beginPath();
                ctx.arc(cursor.x, cursor.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        } else {
            ctx.globalAlpha = alphaMultiplier;
            ctx.beginPath();
            ctx.arc(cursor.x, cursor.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
}

function draw() {
    if (!isWebSocketActive || !ctx) {
        requestAnimationFrame(draw);
        return;
    }

    ctx.clearRect(0, 0, W, H);

    const now = Date.now();
    if (now - lastMovementTime > 100) {
        isMoving = false;
    }

    if (!isMoving && trail.length > 0) {
        trail.shift();
    }

    let alphaMultiplier = 1;
    if (checkInactivity()) {
        const inactiveTime = now - lastActivityTime;
        alphaMultiplier = 1 - (inactiveTime - INACTIVITY_THRESHOLD) / 1000;
        alphaMultiplier = Math.max(0, alphaMultiplier);
    }

    if ((isMoving || trail.length > 1) && trail.length > 1) {
        drawTrail(trail, alphaMultiplier);
    }

    drawCursors(alphaMultiplier);
    requestAnimationFrame(draw);
}