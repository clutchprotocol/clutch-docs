---
sidebar_position: 5
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

**Response (error):**

```json
{
  "error": "faucet disabled"
}
```

No JWT required. The faucet is gated by server configuration instead.

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

## Security notes

- **Disable in production** — set `faucet_enabled = false`
- The faucet private key must never be exposed to clients
- Rate limiting is not built in — add reverse-proxy limits for public deployments

## When faucet fails

Common errors:

| Error | Cause |
|-------|-------|
| `faucet disabled` | `faucet_enabled = false` |
| `insufficient balance` | Faucet account needs more CLT in genesis |
| `node rejected faucet tx` | Node unreachable or invalid key |

Check API logs (Seq) and node connectivity via `/health`.
