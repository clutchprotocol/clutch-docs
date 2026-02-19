---
sidebar_position: 2
---

# Docker Deploy

Full-stack deployment using [clutch-deploy](https://github.com/clutchprotocol/clutch-deploy).

## Services

| Service | Ports | Description |
|---------|-------|-------------|
| clutch-hub-api | 3000 | GraphQL API, /health |
| node1 | 8081, 4001, 3001 | Bootstrap node (WebSocket, libp2p, metrics) |
| node2 | 8082, 4002, 3002 | Node 2 |
| node3 | 8083, 4003, 3003 | Node 3 |
| Prometheus | 9090 | Metrics |
| Grafana | 3030 | Dashboards (admin/admin) |
| Seq | 5341 | Structured logging |

## Configuration

| Path | Purpose |
|------|---------|
| `config/node/node1.toml`, `node2.toml`, `node3.toml` | Node settings, bootstrap peers |
| `config/api/default.toml` | API bind, WebSocket URL, Seq |
| `config/monitoring/prometheus/prometheus.yml` | Scrape targets |
| `config/monitoring/grafana/` | Datasources, dashboards |
| `config/nginx/nginx.conf` | Proxy (when using `--profile proxy`) |
| `.env` | SEQ_API_KEY, JWT_SECRET, ALLOWED_ORIGINS |

## Optional: Nginx Proxy

```bash
docker compose --profile proxy up -d
```

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
