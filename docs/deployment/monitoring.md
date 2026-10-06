---
sidebar_position: 2
---

# Monitoring

Clutch Deploy includes Prometheus, Alertmanager, Grafana, and Seq for metrics, alerts, dashboards, and structured logs.

## Prometheus

- **URL**: http://localhost:9090
- **Config**: `config/monitoring/prometheus/prometheus.yml`, alert rules in `config/monitoring/prometheus/rules/`

Prometheus scrapes, every 10 to 30 seconds:

| Target | What it reports |
|--------|-----------------|
| `node1:3001`, `node2:3002`, `node3:3003` | Each validator's `latest_block_index` and `latest_block{block_hash}` |
| `clutch-hub-api:9090` | The Hub API |
| `treasury-service:9101`, `payment-orchestrator:9102` | Reconciliation, the breaker, mints, deposits, sweeps, alerts |

On the deployed server the same Prometheus also scrapes the mainnet pilot's validators, Hub API and treasury, labelled `chain: mainnet`, so one set of rules and dashboards covers both.

## Alerts

Alert rules live in `config/monitoring/prometheus/rules/` and go through Alertmanager (http://localhost:9093) to one receiver, a Telegram chat on the deployed stacks. The bot token and chat id come from `.env` (`ALERT_TELEGRAM_BOT_TOKEN`, `ALERT_TELEGRAM_CHAT_ID`), never from git. Locally, with neither set, alerts fire and go nowhere.

| Rules | Fire when |
|-------|-----------|
| `chain.yml` | The chain height stops advancing, a validator falls behind the others or stops answering, a node does not publish its latest block hash, or the Hub API is down |
| `treasury.yml` | Reconciliation reads a mismatch or has not run for two hours, minting is halted, the treasury or orchestrator raises a P1, a service is down, sweeping stalls, a paid-for redemption stays unpaid, a mint sits in the outbox, the deposit watcher's position is above the chain head, or deposit polling stalls |

The chain alert works because Aura authors a block every slot even when there is nothing to include, so a height that stops climbing means a broken chain, not a quiet one. The `test-alert-route.yml` workflow sends a synthetic alert, to prove the route reaches a person.

## Grafana

- **URL**: http://localhost:3030 (port 3030 to avoid conflict with the API)
- **Login**: `admin` / `GRAFANA_ADMIN_PASSWORD` from `.env`. Anonymous visitors get read-only access
- **Config**: `config/monitoring/grafana/`. A dashboard JSON dropped in `dashboards/` is picked up within ten seconds

![Grafana dashboard](/img/grafana.svg)

The Clutch Node dashboard has two parts:

| Section | Panels |
|---------|--------|
| Chain | The latest block index of each validator, and its state |
| Treasury | CLT in circulation, USDT in custody, reserve backing, reconciliation and its age, minting, mints credited, deposits by status, needs review, unswept deposit addresses, P1 alerts in the last 24 hours |

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

## Related

- [Clutch Deploy](/deployment/clutch-deploy)
- [Nginx](/deployment/nginx)
- [Node Overview](/clutch-node/overview)
- [Environments](/getting-started/environments)
