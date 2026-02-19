---
sidebar_position: 1
---

# Clutch Hub API Overview

Clutch Hub API bridges applications to the Clutch Node blockchain. It exposes GraphQL and REST endpoints.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/graphql` | POST | GraphQL API |

## Configuration

Main settings in `config/default.toml`:

- **ws_addr** — API bind address (e.g. `0.0.0.0:3000`)
- **clutch_node_ws_url** — Node WebSocket (e.g. `ws://node1:8081/ws`)
- **seq_url** — Seq logging URL

## Docker

```bash
docker run -p 3000:3000 9194010019/clutch-hub-api:latest
```

Or use [clutch-deploy](https://github.com/clutchprotocol/clutch-deploy).
