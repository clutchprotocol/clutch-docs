---
sidebar_position: 1
---

# Security

## Client-side signing

- Private keys **never** leave the user's device
- All transaction signing happens in the browser or mobile app via the SDK
- The API only receives already-signed RLP hex via `sendRawTransaction`
- Three services sign on the server side, and each is scoped narrowly: the faucet (testnet `Transfer` only), `treasury-service` (`Mint`, only once four-eyes approval and the mint gate both pass), and `tron-signer` (signs and broadcasts on Tron — sweeps into custody and, once enabled, redemption payouts from a bounded float). No other transaction type is ever signed anywhere but the client — see [Clutch Treasury Overview](/clutch-treasury/overview) for what each of the other two may and may not do.

## Wallet authentication

- Identity is a blockchain public key — no passwords
- JWT issuance requires **proof of key ownership**: `generateToken(publicKey, timestamp, signature)` verifies a secp256k1 signature over the challenge `clutch-auth:{chain_id}:{publicKey}:{timestamp}` before minting a token
- `chain_id` binds the challenge to a specific network — without it, a challenge signed and captured on one Clutch chain would authenticate the same key on any other Clutch hub within the clock-skew window
- The challenge timestamp must be within ±120s of server time (stateless replay window)
- Change `jwt_secret` in production; tokens expire after `jwt_expiration_hours`

### JWT best practices

- Use a long, random `jwt_secret` (32+ bytes) sourced from environment, not committed config
- Rotate the secret periodically; rotation invalidates outstanding tokens
- Consider adding `iss`/`aud` claims if you run multiple services sharing the same secret
- Keep token lifetimes short for end users; longer only for trusted service accounts
- Never log JWT contents in production logging

## Cryptographic libraries

- **Signing**: secp256k1 (`@noble/secp256k1`)
- **Hashing**: Keccak-256
- **Encoding**: RLP

See [Signing and Encoding](/reference/signing-and-encoding) for the exact algorithm (including the UTF-8 hash hex signing detail).

## Replay protection

- Account nonce increments with each accepted transaction
- Each transaction hash is unique
- `chain_id` is signed into every transaction and auth challenge, so neither can be replayed across chains — a transaction (or login) built for testnet is rejected by a node on any other chain

## Faucet security

- Disable in production: `faucet_enabled = false`
- Never expose `faucet_private_key` to clients
- Add rate limiting at the reverse proxy for public testnets
- The Hub API refuses to start at all if `faucet_enabled = true` against a chain where `is_testnet = false` — a faucet surviving onto a real, reserve-backed network would let anyone mint apparent value with nothing behind it

### Faucet abuse controls

On a public testnet, an open faucet invites scripted drain attempts. Layer these controls:

- **Reverse-proxy rate limiting**: nginx `limit_req_zone` keyed by remote address
- **Per-IP / per-wallet caps**: drip a fixed amount per address per time window
- **Challenge gating**: optional proof-of-work or captcha before issuing a drip
- **Allow-listing**: restrict drips to known testnet wallets during controlled betas
- **Monitoring**: alert on abnormal drip volume and watch the faucet account balance

## Key management

| Key | Where it lives | Exposure guidance |
|-----|----------------|-------------------|
| User private key | Client device (browser/mobile) | Never transmitted; optionally cached in localStorage with explicit user consent |
| Validator `author_secret_key` | Node host / secret manager | Environment or secret manager; never in git; restrict file permissions |
| `mint_authority` secret key | Dedicated treasury signer (never a validator host) | Highest-value key in the system — it is the only key that can create new CLT; use a key-ceremony-generated key, not a dev/validator key, in any deployment beyond local testing |
| Deposit mnemonic | `tron-signer` only — never `payment-orchestrator` | Derives every Tron key the stack uses (deposit addresses, the fee account, the payout float). The orchestrator holds only the derived account **xpub**, which can derive receive addresses and cannot sign — see [Clutch Treasury Overview](/clutch-treasury/overview) |
| Payout float key | Derived by `tron-signer` at its own path, separate from every deposit address | Not a general treasury key — spendable only through `tron-signer`'s `/internal/payout`, and bounded by the float's own balance plus a per-transaction cap, so exposure is capped by the float, not by a permission system — see [Redemptions](/clutch-treasury/redemptions) |
| API `jwt_secret` | Hub API host / env var | Random 32+ bytes; rotated; not logged |
| `faucet_private_key` | Hub API host (testnet only) | Disabled in prod; never sent to clients |

:::danger Still environment variables, not production custody
Every key above — including the two treasury rows — is an environment variable today, not a key behind a KMS or a hardware boundary. That is a stated, tracked gap, not an oversight: `ChainSigner` (the mint key) and `PayoutSigner` (the payout key) are both already written as swap boundaries for a future signer, and the named mainnet blocker is an AWS-KMS-backed signer, a real key ceremony, and tested recovery — all before any of this holds real funds. See [Clutch Treasury Overview — Testnet posture](/clutch-treasury/overview#testnet-posture).
:::

### Recommendations

- Prefer OS keychain or hardware-backed storage for user keys where available
- Encrypt validator and API secrets at rest
- Use separate secrets per environment (dev / stage / prod)
- Audit who has access to secret stores and rotate on team changes

## Threat model

| Threat | Mitigation |
|--------|------------|
| MITM on transaction submission | Client-side signing; signed payload is tamper-evident |
| Node JSON-RPC is unauthenticated, path-blind, and bound to `0.0.0.0` | No mitigation at the protocol layer — front it with a reverse proxy or firewall before it is reachable beyond trusted operators; see [Node Configuration — JSON-RPC exposure](/clutch-node/configuration#json-rpc-exposure) |
| Replay of a submitted tx | Per-account nonce enforced on-chain |
| Cross-chain replay of a tx or auth challenge | `chain_id` signed into both; a node rejects a mismatched `chain_id` |
| Hub returns a transaction that doesn't match what the app asked for | SDK's `verifyUnsignedTransaction` checks type/amount/references/from/chain_id before signing (does not cover `referrer`, which is display-only) |
| Stolen JWT | Short lifetimes; secret rotation; HTTPS-only |
| Faucet drain | Disable in prod; rate limit; per-wallet caps; monitoring |
| Faucet surviving onto a real network | Hub API refuses to start if enabled against a non-testnet chain |
| Compromised validator key | Rotate keys; limit validator set; audit block authorship |
| Compromised mint authority key | Restrict to a dedicated treasury key (never a validator key); the chain enforces authority + exactly-once `credit_ref`, but cannot verify reserve exists — that's a process/reconciliation control, not consensus |
| A single compromised treasury service moves money | Structural, not a permission check: `payment-orchestrator` holds an xpub and no signing key at all, `treasury-service`'s key only ever signs a Clutch-chain `Mint` — a different chain — and `tron-signer`'s sweep endpoint takes an index only, never a destination. No one service holds both the authority to decide and the means to move funds — see [Clutch Treasury Overview](/clutch-treasury/overview) |
| CORS abuse | Restrict `ALLOWED_ORIGINS` to known frontends |
| Replay via stale config | Validate config at startup; fail fast on missing secrets |

## Production checklist

- [ ] Change `jwt_secret` in API config
- [ ] Disable faucet
- [ ] Use strong `SEQ_API_KEY` if Seq is exposed
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Never store private keys server-side
- [ ] Use HTTPS in production (nginx / Cloudflare)
- [ ] Do not store production keys in browser localStorage
- [ ] Rate-limit `/faucet` at the reverse proxy
- [ ] Rotate validator and API secrets periodically
- [ ] Restrict access to Grafana and Seq to trusted networks

## Related

- [Authentication](/clutch-hub-api/authentication)
- [SDK Usage](/clutch-hub-sdk-js/usage)
- [Nginx](/deployment/nginx)
- [Faucet](/clutch-hub-api/faucet)
- [Clutch Treasury Overview](/clutch-treasury/overview) — key management for the mint authority, the deposit mnemonic, and the payout float
- [Node Configuration](/clutch-node/configuration) — the JSON-RPC exposure note
