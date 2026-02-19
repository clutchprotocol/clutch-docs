---
sidebar_position: 2
---

# Monitoring

Clutch Deploy includes Prometheus and Grafana.

## Prometheus

- **URL**: http://localhost:9090
- **Scrape targets**: node1:3001, node2:3002, node3:3003
- **Config**: `config/monitoring/prometheus/prometheus.yml`

## Grafana

- **URL**: http://localhost:3030 (port 3030 to avoid conflict with API)
- **Login**: admin / admin
- **Dashboards**: Clutch Node dashboard (state, block index, latest blocks)
- **Config**: `config/monitoring/grafana/`

## Metrics Endpoints

| Target | URL |
|--------|-----|
| Node 1 | http://localhost:3001/metrics |
| Node 2 | http://localhost:3002/metrics |
| Node 3 | http://localhost:3003/metrics |

## Seq (Logging)

- **URL**: http://localhost:5341
- **Purpose**: Structured logging from nodes and API
