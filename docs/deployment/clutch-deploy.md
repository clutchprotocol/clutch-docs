---
sidebar_position: 1
---

# Clutch Deploy

[clutch-deploy](https://github.com/clutchprotocol/clutch-deploy) provides Docker Compose for the full Clutch stack.

## Quick Start

```bash
git clone https://github.com/clutchprotocol/clutch-deploy.git
cd clutch-deploy
cp .env.example .env
docker compose up -d
```

## Services

| Service | Ports | Description |
|---------|-------|-------------|
| clutch-hub-api | 3000 | GraphQL, /health |
| node1 | 8081, 4001, 3001 | Bootstrap node |
| node2 | 8082, 4002, 3002 | Node 2 |
| node3 | 8083, 4003, 3003 | Node 3 |
| Prometheus | 9090 | Metrics |
| Grafana | 3030 | Dashboards (admin/admin) |
| Seq | 5341 | Structured logs |
| nginx | 80 | Reverse proxy (optional, `--profile proxy`) |

## Verify

- API: http://localhost:3000/health
- Grafana: http://localhost:3030
- Seq: http://localhost:5341

## Reset

```bash
docker compose down -v
docker compose up -d
```
