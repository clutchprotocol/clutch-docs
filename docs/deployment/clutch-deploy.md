---
sidebar_position: 1
---

# Clutch Deploy

[clutch-deploy](https://github.com/clutchprotocol/clutch-deploy) provides Docker Compose for the full Clutch stack. Compose files pull pre-built images from [GHCR](/reference/docker-images) (`ghcr.io/clutchprotocol/...:latest`).

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

## Services

| Service | Ports | Description |
|---------|-------|-------------|
| clutch-hub-api | 3000 | GraphQL, /health, /faucet |
| clutch-hub-demo-app | 5173 | Reference React demo |
| clutch-explorer-backend | 8088 | Block explorer REST API |
| clutch-explorer-frontend | 5174 | Block explorer UI |
| clutch-explorer-indexer | — | Poll → fetch → upsert loop into Postgres; same image as clutch-explorer-backend, run as its own process |
| clutch-explorer-postgres | — (internal network only) | Indexed chain data for the explorer API |
| node1 | 8081, 4001, 3001 | Bootstrap validator |
| node2 | 8082, 4002, 3002 | Validator 2 |
| node3 | 8083, 4003, 3003 | Validator 3 |
| Prometheus | 9090 | Metrics collection |
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

## Related

- [Treasury Stack](/deployment/treasury-stack) — the treasury overlay: three more services, one more network
- [Monitoring](/deployment/monitoring)
- [Nginx](/deployment/nginx)
- [Environments](/getting-started/environments)
- [Explorer Getting Started](/clutch-explorer/getting-started)
