# NoSkid WebSocket Server

A lightweight WebSocket server with basic authentication, health checks, and anti-abuse handling.

### Features

* Auth system
* Max 50 clients
* Healthcheck every 30s (`ping`/`pong`)
* Auto-ban for 5 min on malformed data
* Broadcasts `{ id, x, y }` to others

### Run

```bash
npm install
npm start
```

Runs on `ws://localhost:8057` (we use a nginx reverse proxy for ssl & open it to internet on ws.noskid.today)

<a align="center" href="https://github.com/douxxtech" target="_blank">
<img src="https://madeby.douxx.tech"></img>
</a>