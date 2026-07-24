---
sidebar_position: 7
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
| `clutch_node_ws_url` | Node WebSocket URL (no path) | `ws://127.0.0.1:8081` |
| `seq_url` | Seq logging URL | `http://seq:5341` |
| `seq_api_key` | Seq API key | `""` |
| `allowed_origins` | CORS allow-list, or `*` | `*` |
| `jwt_secret` | JWT signing secret — see rules below | 32+ random chars |
| `jwt_expiration_hours` | Token lifetime (hours) | `6` |
| `log_level` | Logging level | `info` |
| `faucet_enabled` | Enable POST /faucet | `true` (testnet) |
| `faucet_private_key` | Faucet signing key | hex secp256k1 |
| `faucet_amount_clt` | CLT per faucet request | `1000` |
| `default_ride_request_referrer` | Injected referrer on requests | address or empty |
| `default_ride_offer_referrer` | Injected referrer on offers | address or empty |

Set these to your CLT wallet to earn referrer fees on rides through your Hub. Clients cannot override referrer on the Hub API — it is server-side only. See [App Developer Incentives](/getting-started/app-developer-incentives).

## jwt_secret validation

The API **refuses to start** on a weak `jwt_secret`. It is rejected if it is empty, shorter than 32 characters, or contains any placeholder marker (`change-me`, `changeme`, `your-secret`, `your-super-secret`, `secret-here`, `placeholder`, matched case-insensitively as a substring).

Generate a real one:

```bash
openssl rand -hex 32
```

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
```

## Environment overrides

```bash
APP_CLUTCH_NODE_WS_URL=ws://localhost:8081
APP_JWT_SECRET=<64 hex chars from the command above>
APP_FAUCET_ENABLED=false
```

## Docker (clutch-deploy)

The API container mounts `config/api/default.toml`. Override via `.env` in clutch-deploy:

```
JWT_SECRET=<64 hex chars — a placeholder here stops the API from booting>
ALLOWED_ORIGINS=http://localhost:5173
```

## Production checklist

- [ ] Set strong `jwt_secret`
- [ ] Disable faucet (`faucet_enabled = false`)
- [ ] Configure CORS / `ALLOWED_ORIGINS`
- [ ] Use HTTPS via nginx reverse proxy
- [ ] Set `SEQ_API_KEY` if Seq is exposed

See [Security](/reference/security) and [Deployment](/deployment/clutch-deploy).
