---
sidebar_position: 2
---

# Docker Deploy

Full-stack deployment using [clutch-deploy](https://github.com/clutchprotocol/clutch-deploy).

## Services

| Service | Ports | Description |
|---------|-------|-------------|
| clutch-hub-api | 3000 | GraphQL API, /health |
| node1 | 8081, 4001, 3001 | Bootstrap node |
| node2 | 8082, 4002, 3002 | Node 2 |
| node3 | 8083, 4003, 3003 | Node 3 |
| Prometheus | 9090 | Metrics |
| Grafana | 3030 | Dashboards (admin/admin) |
| Seq | 5341 | Structured logging |

## Configuration

| Path | Purpose |
|------|---------|
| `config/node/*.toml` | Node settings |
| `config/api/default.toml` | API bind, WebSocket URL |
| `config/monitoring/` | Prometheus, Grafana configs |
| `.env` | `SEQ_API_KEY`, `JWT_SECRET`, `ALLOWED_ORIGINS` |

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

# Full reset
docker compose down -v
docker compose up -d
```
