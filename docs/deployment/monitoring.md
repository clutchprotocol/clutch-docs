---
sidebar_position: 2
---

# Monitoring

Clutch Deploy includes Prometheus, Grafana, and Seq for metrics, dashboards, and structured logs.

## Prometheus

- **URL**: http://localhost:9090
- **Scrape targets**: `node1:3001`, `node2:3002`, `node3:3003`
- **Config**: `config/monitoring/prometheus/prometheus.yml`

Prometheus scrapes each node's `/metrics` endpoint on a fixed interval and stores time series for the Grafana dashboards.

## Grafana

- **URL**: http://localhost:3030 (port 3030 to avoid conflict with the API)
- **Login**: `admin` / `GRAFANA_ADMIN_PASSWORD` from `.env`
- **Dashboards**: Clutch Node dashboard (state, block index, latest blocks)
- **Config**: `config/monitoring/grafana/`

![Grafana dashboard](/img/grafana.svg)

Dashboard panels typically cover:

| Metric | Meaning |
|--------|---------|
| Block index | Height of the latest finalized block |
| Latest blocks | Recent block hashes and authors |
| Node state | Aura state (syncing, ready, etc.) |
| Connected peers | libp2p peer count |
| RPC rate / errors | JSON-RPC requests and failures per node |

## Metrics endpoints

| Target | URL |
|--------|-----|
| Node 1 | http://localhost:3001/metrics |
| Node 2 | http://localhost:3002/metrics |
| Node 3 | http://localhost:3003/metrics |

## Seq (Logging)

- **URL**: http://localhost:5341
- **Purpose**: Structured logging from nodes and the API

Seq collects structured events (JSON) from nodes and the Hub API. Use it to trace transaction processing, RPC errors, and reconnection events. Protect it with `SEQ_API_KEY` if exposed beyond localhost.

## Alert suggestions

| Condition | Suggested action |
|-----------|------------------|
| Block index stops advancing on a validator | Check Aura state and peer connectivity |
| RPC error rate > threshold | Inspect Seq for malformed txs or node errors |
| Peer count drops to 0 on any node | Verify libp2p ports and bootstrap peer |
| `/health` non-200 on Hub API | Restart `clutch-hub-api`, check node WS connection |

Alert rules can be added to Prometheus via `config/monitoring/prometheus/` and routed through Alertmanager if you wire one up.

## Related

- [Clutch Deploy](/deployment/clutch-deploy)
- [Nginx](/deployment/nginx)
- [Node Overview](/clutch-node/overview)
- [Environments](/getting-started/environments)
