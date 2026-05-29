---
sidebar_position: 2
---

# Explorer Getting Started

## With clutch-deploy

The explorer is included in the full Docker stack:

```bash
git clone https://github.com/clutchprotocol/clutch-deploy.git
cd clutch-deploy
cp .env.example .env
docker compose up -d
```

| Service | URL |
|---------|-----|
| Explorer UI | http://localhost:5174 |
| Explorer API | http://localhost:8088 |
| API health | http://localhost:8088/health |

Docker images (GHCR only): [`clutch-explorer-backend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-backend), [`clutch-explorer-frontend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-frontend). Full list: [Docker images](/reference/docker-images).

## Standalone development

See the [clutch-explorer](https://github.com/clutchprotocol/clutch-explorer) repository for backend and frontend setup with Postgres.

## Frontend routes

| Route | Page |
|-------|------|
| `/` | Dashboard / stats |
| `/blocks` | Block list |
| `/blocks/:id` | Block detail |
| `/txs` | Transaction list |
| `/txs/:hash` | Transaction detail |
| `/address/:address` | Account page |
| `/validators` | Validator set |

## Environment variables

### Backend

| Setting | Description |
|---------|-------------|
| `EXPLORER_POSTGRES_*` | Database connection (in clutch-deploy `.env`) |
| `indexer_poll_interval_ms` | Block poll interval (default 4000) |
| `clutch_node_ws_url` | Node WebSocket for indexing |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_EXPLORER_API_URL` | Backend API URL (default `http://localhost:8088`) |

## Verify indexing

1. Submit a transaction via the demo app or SDK
2. Wait for the indexer poll (~4 seconds)
3. Search the transaction hash in the explorer UI or API

```bash
curl "http://localhost:8088/api/v1/search?q=0xYourTxHash"
```

## Related

- [API Reference](/clutch-explorer/api-reference)
- [Clutch Deploy](/deployment/clutch-deploy)
