---
sidebar_position: 1
---

# Clutch Deploy

[clutch-deploy](https://github.com/clutchprotocol/clutch-deploy) provides Docker Compose for the full Clutch stack. Compose files pull pre-built images from [GHCR](/reference/docker-images), each pinned to an exact `sha-<7>` tag.

## Quick start

```bash
git clone https://github.com/clutchprotocol/clutch-deploy.git
cd clutch-deploy
cp .env.example .env
docker compose up -d
```

Dev override with local builds:

```powershell
docker compose -p clutch-dev -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## Compose files

| File | Role |
|------|------|
| `docker-compose.yml` | The base stack, from pinned GHCR images. Always the first `-f` |
| `docker-compose.dev.yml` | Development: builds the Rust services from sibling checkouts and runs the frontends as Vite dev servers with hot reload |
| `docker-compose.treasury.yml` | The treasury: three more services and an internal network. See [Treasury Stack](/deployment/treasury-stack) |
| `docker-compose.stage.cloudflare-flex.yml`, `docker-compose.stage.treasury.yml` | The stage server: no service publishes a port, and nginx in front is the only way in |
| `docker-compose.nginx.yml` | An optional local reverse proxy on port 80. See [Nginx](/deployment/nginx) |
| `docker-compose.mainnet.yml`, `docker-compose.mainnet.treasury.yml` | The mainnet pilot: its own three validators, Hub API, demo app and treasury, with their own pins and their own env file |

## Image tags

A deploy ships exactly the image tags written in the compose files, and nothing newer. Each Clutch image is pinned to the `sha-<7>` tag its own CI pushed; monitoring images carry exact versions. When the node, the Hub API, the demo app or the explorer publish a new image, their CI moves the stage pin in a commit to `main` here and the stage redeploys. The treasury's pins move only by hand. Mainnet moves only by a workflow that copies the pins the stage already runs, so nothing reaches the mainnet that the testnet has not run first. Rolling back is a revert of the pin commit.

The mainnet validators are the exception: their image changes only with a chain reset or a planned upgrade of every validator, because a change in what a node accepts is a consensus change.

## Services

| Service | Ports | Description |
|---------|-------|-------------|
| clutch-hub-api | 3000 | GraphQL, /health |
| clutch-hub-demo-app | 5173 | Reference React demo |
| clutch-explorer-backend | 8088 | Block explorer REST API |
| clutch-explorer-frontend | 5174 | Block explorer UI |
| clutch-explorer-indexer | — | Poll → fetch → upsert loop into Postgres; same image as clutch-explorer-backend, run as its own process |
| clutch-explorer-postgres | — (internal network only) | Indexed chain data for the explorer API |
| node1 | 8081, 4001, 3001 | Bootstrap validator |
| node2 | 8082, 4002, 3002 | Validator 2 |
| node3 | 8083, 4003, 3003 | Validator 3 |
| Prometheus | 9090 | Metrics collection and alert rules |
| Alertmanager | 9093 | Routes alerts (Telegram on the deployed stacks) |
| Grafana | 3030 | Dashboards (`admin` / `GRAFANA_ADMIN_PASSWORD` from `.env`) |
| Seq | 5341 | Structured logs |
| nginx | 80 | Reverse proxy (optional — see [Nginx](/deployment/nginx)) |

The indexer being a separate process from the API is why the explorer can keep serving reads even while indexing falls behind the chain tip — see the [FAQ](/reference/faq#explorer).

## Verify

- API: http://localhost:3000/health
- Demo: http://localhost:5173
- Explorer: http://localhost:5174
- Grafana: http://localhost:3030
- Seq: http://localhost:5341

## Environment variables

Key entries in `.env`:

```
JWT_SECRET=change-me
ALLOWED_ORIGINS=http://localhost:5173
EXPLORER_POSTGRES_PASSWORD=...
EXPLORER_ALLOWED_ORIGINS=http://localhost:5174
```

See `.env.example` in the repository for the full list.

## Reset

```bash
docker compose down -v
docker compose up -d
```

`down -v` deletes the volumes, which hold each node's chain, the explorer's database and the monitoring state. A plain restart keeps the chain: each node keeps its database in its own volume, and every config in this repo sets `developer_mode = false`, because `true` makes a node delete its database when it stops (see [Node Configuration](/clutch-node/configuration)).

## Related

- [Treasury Stack](/deployment/treasury-stack) — the treasury overlay: three more services, one more network
- [Monitoring](/deployment/monitoring)
- [Nginx](/deployment/nginx)
- [Environments](/getting-started/environments)
- [Explorer Getting Started](/clutch-explorer/getting-started)
