---
sidebar_position: 2
---

# Docker Deploy

Full-stack deployment using [clutch-deploy](https://github.com/clutchprotocol/clutch-deploy).

Pre-built images are published to [GHCR and Docker Hub](/reference/docker-images). `clutch-deploy` compose files reference the GHCR `:latest` tags.

## Services

| Service | Ports | Description |
|---------|-------|-------------|
| clutch-hub-api | 3000 | GraphQL API, /health, /faucet |
| clutch-hub-demo-app | 5173 | Reference React demo |
| clutch-explorer-backend | 8088 | Block explorer REST API |
| clutch-explorer-frontend | 5174 | Block explorer UI |
| node1 | 8081, 4001, 3001 | Bootstrap node (WebSocket, libp2p, metrics) |
| node2 | 8082, 4002, 3002 | Node 2 |
| node3 | 8083, 4003, 3003 | Node 3 |
| Prometheus | 9090 | Metrics |
| Grafana | 3030 | Dashboards (`admin` / `GRAFANA_ADMIN_PASSWORD` from `.env`) |
| Seq | 5341 | Structured logging |
| nginx | 80 | Reverse proxy (optional — see [Nginx](/deployment/nginx)) |

## Configuration

| Path | Purpose |
|------|---------|
| `config/node/node1.toml`, `node2.toml`, `node3.toml` | Node settings, bootstrap peers |
| `config/api/default.toml` | API bind, WebSocket URL, Seq |
| `config/monitoring/prometheus/prometheus.yml` | Scrape targets |
| `config/monitoring/grafana/` | Datasources, dashboards |
| `config/nginx/nginx.conf` | Proxy config, local/dev only — see [Nginx](/deployment/nginx) |
| `.env` | SEQ_API_KEY, JWT_SECRET, ALLOWED_ORIGINS |

## Optional: Nginx Proxy

Not a compose profile — none is defined anywhere in this stack, so `docker compose --profile proxy up -d` starts everything except nginx, silently. It's a separate compose file that joins the main stack's network from outside, and needs the main stack running under project name `clutch-dev` specifically:

```bash
docker compose -p clutch-dev -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose -p clutch-nginx -f docker-compose.nginx.yml up -d
```

See [Nginx](/deployment/nginx) for why the project name matters and what it routes.

## Common Commands

```bash
# View logs
docker compose logs -f clutch-hub-api

# Restart API
docker compose restart clutch-hub-api

# Full reset (removes volumes)
docker compose down -v
docker compose up -d
```

## Verify

- API: http://localhost:3000/health
- Demo: http://localhost:5173
- Explorer: http://localhost:5174
- Grafana: http://localhost:3030
- Seq: http://localhost:5341

## Related

- [Clutch Deploy](/deployment/clutch-deploy)
- [Quick Start](/getting-started/quickstart)
- [Environments](/getting-started/environments)
- [Monitoring](/deployment/monitoring)
- [Nginx](/deployment/nginx)
