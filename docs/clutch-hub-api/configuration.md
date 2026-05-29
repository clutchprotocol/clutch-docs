---
sidebar_position: 4
---

# API Configuration

Configuration is loaded from TOML files with `APP_` environment variable overrides.

## Config files

| Path | Usage |
|------|-------|
| `config/default.toml` | Local / standalone API |
| `config/api/default.toml` | clutch-deploy Docker mount |
| `config/{env}.toml` | Environment-specific (via `--env` flag) |

Environment variables use the `APP_` prefix: `APP_LOG_LEVEL=debug` maps to `log_level`.

## Key settings

| Setting | Description | Example |
|---------|-------------|---------|
| `ws_addr` | API HTTP bind address | `0.0.0.0:3000` |
| `serve_metric_addr` | Prometheus metrics bind | `0.0.0.0:9090` |
| `clutch_node_ws_url` | Node WebSocket URL | `ws://node1:8081/ws` |
| `seq_url` | Seq logging URL | `http://seq:80` |
| `seq_api_key` | Seq API key | `""` |
| `jwt_secret` | JWT signing secret | Change in production |
| `jwt_expiration_hours` | Token lifetime (hours) | `6` |
| `log_level` | Logging level | `info` |
| `faucet_enabled` | Enable POST /faucet | `true` (testnet) |
| `faucet_private_key` | Faucet signing key | hex secp256k1 |
| `faucet_amount_clt` | CLT per faucet request | `1000` |
| `default_ride_request_referrer` | Injected referrer on requests | address or empty |
| `default_ride_offer_referrer` | Injected referrer on offers | address or empty |

## Environment overrides

```bash
APP_CLUTCH_NODE_WS_URL=ws://localhost:8081/ws
APP_JWT_SECRET=your-production-secret
APP_FAUCET_ENABLED=false
```

## Docker (clutch-deploy)

The API container mounts `config/api/default.toml`. Override via `.env` in clutch-deploy:

```
JWT_SECRET=change-me-in-production
ALLOWED_ORIGINS=http://localhost:5173
```

## Production checklist

- [ ] Set strong `jwt_secret`
- [ ] Disable faucet (`faucet_enabled = false`)
- [ ] Configure CORS / `ALLOWED_ORIGINS`
- [ ] Use HTTPS via nginx reverse proxy
- [ ] Set `SEQ_API_KEY` if Seq is exposed

See [Security](/reference/security) and [Deployment](/deployment/clutch-deploy).
