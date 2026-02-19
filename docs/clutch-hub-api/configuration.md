---
sidebar_position: 4
---

# API Configuration

Config file: `config/default.toml` (or `config/{env}.toml`).

## Key Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `ws_addr` | API bind address (main server) | `0.0.0.0:3000` |
| `serve_metric_addr` | Prometheus metrics bind | `0.0.0.0:9090` |
| `clutch_node_ws_url` | Node WebSocket URL | `ws://node1:8081/ws` |
| `seq_url` | Seq logging URL | `http://seq:80` |
| `seq_api_key` | Seq API key (optional) | `""` |
| `jwt_secret` | JWT signing secret | Change in production |
| `jwt_expiration_hours` | Token lifetime | `6` |
| `log_level` | Logging level | `info` |

## Environment Override

Use `APP_` prefix: e.g. `APP_LOG_LEVEL=debug`, `APP_CLUTCH_NODE_WS_URL=ws://localhost:8081/ws`.
