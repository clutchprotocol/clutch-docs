---
sidebar_position: 6
---

# Faucet

The Hub API provides a testnet faucet that sends CLT to any address via a server-signed `Transfer` transaction.

## Endpoint

```
POST /faucet
Content-Type: application/json

{
  "address": "0xYourPublicKeyOrAddress"
}
```

**Response (success):**

```json
{
  "ok": true,
  "amount_clt": 1000,
  "node": { }
}
```

**Response (error):** a JSON body with an `error` string and a real HTTP status (400, 429, or 503):

```json
{
  "error": "Faucet is disabled (set faucet_enabled = true in config for test networks)"
}
```

No JWT required. The faucet is gated by server configuration and a built-in rate limiter instead.

## SDK

```javascript
const res = await sdk.requestFaucet(publicKey);
if (res.ok) {
  console.log('Received', res.amount_clt, 'CLT');
} else {
  console.error(res.error);
}
```

## Configuration

In `config/{env}.toml` (or `APP_*` environment overrides):

| Setting | Description |
|---------|-------------|
| `faucet_enabled` | Enable/disable the endpoint |
| `faucet_private_key` | Hex secp256k1 key for the faucet account (must hold CLT) |
| `faucet_amount_clt` | CLT sent per request (default: 1000) |

Example from clutch-deploy:

```toml
faucet_enabled = true
faucet_private_key = "d2c446110cfcecbdf05b2be528e72483de5b6f7ef9c7856df2f81f48e9f2748f"
faucet_amount_clt = 1000
```

:::warning Test-only key
The `faucet_private_key` shown above is the public testnet genesis faucet key. It is for **testnet experimentation only** — never reuse it on any production or value-bearing network. For a private deployment, generate a fresh secp256k1 keypair and fund that account in your genesis. Never commit a production faucet key to source control.
:::

The faucet account must be funded in the node's genesis configuration.

## Address formats

The faucet accepts:

- 20-byte hex address (`0x` + 40 hex chars)
- 130-char uncompressed secp256k1 public key (with or without `0x`)

## Rate limiting

Cooldowns are enforced by the Hub API itself (in-memory, shared across all worker threads):

| Key | Cooldown |
|-----|----------|
| Client IP | 30 seconds |
| Recipient address (case-insensitive) | 3600 seconds (1 hour) |

Either cooldown being active rejects the request with HTTP **429**, a `Retry-After` header, and a body carrying the remaining seconds:

```json
{
  "error": "faucet cooldown active, try again later",
  "retry_after_secs": 27
}
```

A rejected request does **not** refresh the cooldown. The client IP is read from `X-Forwarded-For` / `X-Real-IP` when present, falling back to the socket peer — so a public deployment must sit behind a trusted reverse proxy, or callers can spoof the header and bypass the per-IP limit. The per-address cooldown still applies regardless.

The cooldown windows are compile-time constants and cannot be tuned via config.

## Security notes

- **Disable in production** — set `faucet_enabled = false`
- The faucet private key must never be exposed to clients
- Per-IP and per-address cooldowns are built in (see above); for public testnets layer reverse-proxy limits on top, since the per-IP window relies on a trusted proxy for the real client IP

## When faucet fails

Common errors:

| Status | Error | Cause |
|--------|-------|-------|
| 503 | `Faucet is disabled (set faucet_enabled = true in config for test networks)` | `faucet_enabled = false` |
| 503 | `Faucet is not configured (set faucet_private_key to a funded account private key)` | `faucet_private_key` is empty |
| 400 | `Invalid public key length. Expected 40 or 130 characters, got …` | Malformed `address` |
| 429 | `faucet cooldown active, try again later` | Cooldown still active (see [Rate limiting](#rate-limiting)) |
| 400 | `faucet account 0x… has insufficient balance (have N, need M)` | Faucet account needs more CLT in genesis |
| 400 | `node rejected faucet tx: …` | Node unreachable or rejected the transfer |

Check API logs (Seq) and node connectivity via `/health`.
