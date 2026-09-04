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
  "amount_clt": 100000000,
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

:::danger Refuses to start on a non-testnet chain
At startup, the Hub API reads the node's chain info and checks `is_testnet`. If `faucet_enabled = true` against a non-testnet chain, **the process panics and does not start** — this is deliberately the one place in this codebase that fails hard instead of returning an error, because a faucet that survives onto a real, value-bearing network could mint real-looking transfers from an account that is never actually funded from reserve. This is a boot-time check, not a per-request one; there is no runtime path that re-verifies `is_testnet` on every `/faucet` call.
:::

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
| `faucet_amount_clt` | CLT sent per request (shipped default: `100000000` = $100) |

Example from clutch-hub-api's own local `config/default.toml` — **not** clutch-deploy, which ships `faucet_private_key` empty by design (see the warning below):

```toml
faucet_enabled = true
faucet_private_key = "<your funded testnet key>"
faucet_amount_clt = 100000000
```

:::info Code fallback differs from the shipped config
If `faucet_amount_clt` is left out of config entirely, the Rust default (`default_faucet_amount()` in `configuration.rs`) is `1000` CLT ($0.001) — a leftover from before the 1,000,000-CLT-per-dollar peg. Every shipped TOML (clutch-hub-api's own `config/default.toml` and clutch-deploy's `config/api/default.toml`) sets it explicitly to `100000000` ($100), so the smaller number only shows up if you remove the setting.
:::

:::warning Test-only key
Replace `<your funded testnet key>` with your own secp256k1 private key, funded in your own genesis — never a key already used on a production or value-bearing network. Never commit a real private key to source control, even a testnet-only one.
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

A rejected request does **not** refresh the cooldown. The client IP is read from `X-Forwarded-For` / `X-Real-IP` when present, falling back to the socket peer — so a public deployment must sit behind a trusted reverse proxy, or callers can spoof the header and bypass the per-IP limit. The per-address cooldown keys on the submitted `address` string exactly as received, **before** the normalization the send path applies to it — so the 20-byte-address form and the 130-char-public-key form of the same recipient cool down as two unrelated keys, and alternating between them bypasses the per-address limit entirely. Treat it as a courtesy, not a control: a public deployment needs its own rate limiting at the proxy in front, not just these built-in cooldowns.

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
