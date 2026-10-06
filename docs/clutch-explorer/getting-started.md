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
| `/search?q=` | Search results, when a query matches more than one thing |

Press `/` anywhere to jump to the search box.

## Environment variables

### Backend

Config loads from `config/{env}.toml`, with environment variables using the `APP_` prefix: `APP_NODE_WS_URL=ws://...` maps to the TOML key `node_ws_url`, not the bare key name — same rule as the [Hub API](/clutch-hub-api/configuration#config-files).

| Setting | Description |
|---------|-------------|
| `EXPLORER_POSTGRES_*` | Database connection (in clutch-deploy `.env`, composed into `APP_DATABASE_URL`) |
| `APP_INDEXER_POLL_INTERVAL_MS` | Block poll interval (default 4000) |
| `APP_NODE_WS_URL` | Node WebSocket for indexing |
| `APP_NODE_METRICS_URL` | Node Prometheus endpoint, read for the chain head (default `http://node1:3001/metrics`) |
| `APP_CLUTCH_NODE_API_URL` | Node HTTP API URL (required, no default) |
| `APP_TREASURY_PUBLIC_RECONCILIATION_URL` | The treasury's `/public/reconciliation`, republished as [`/api/v1/reserve`](/clutch-explorer/api-reference#reserve). Empty (the default) leaves the reserve section out |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_EXPLORER_API_URL` | Backend API URL; `/api` is appended. Default `http://localhost:8088` on localhost, otherwise the relative `/api`. Baked in at build time |
| `VITE_NETWORK_LABEL` | The network chip in the header. Unset, it is read from the hostname: `*-stage.*` shows Testnet, `*.clutchprotocol.io` shows Mainnet pilot, anything else Local |

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
