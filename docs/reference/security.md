---
sidebar_position: 1
---

# Security

## Client-side signing

- Private keys **never** leave the user's device
- All transaction signing happens in the browser or mobile app via the SDK
- The API only receives already-signed RLP hex via `sendRawTransaction`
- The faucet is the only server-side signer (testnet `Transfer` only)

## Wallet authentication

- Identity is a blockchain public key — no passwords
- JWT proves wallet ownership via `generateToken(publicKey)`
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

## Faucet security

- Disable in production: `faucet_enabled = false`
- Never expose `faucet_private_key` to clients
- Add rate limiting at the reverse proxy for public testnets

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
| API `jwt_secret` | Hub API host / env var | Random 32+ bytes; rotated; not logged |
| `faucet_private_key` | Hub API host (testnet only) | Disabled in prod; never sent to clients |

### Recommendations

- Prefer OS keychain or hardware-backed storage for user keys where available
- Encrypt validator and API secrets at rest
- Use separate secrets per environment (dev / stage / prod)
- Audit who has access to secret stores and rotate on team changes

## Threat model

| Threat | Mitigation |
|--------|------------|
| MITM on transaction submission | Client-side signing; signed payload is tamper-evident |
| Replay of a submitted tx | Per-account nonce enforced on-chain |
| Stolen JWT | Short lifetimes; secret rotation; HTTPS-only |
| Faucet drain | Disable in prod; rate limit; per-wallet caps; monitoring |
| Compromised validator key | Rotate keys; limit validator set; audit block authorship |
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
