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

## Production checklist

- [ ] Change `jwt_secret` in API config
- [ ] Disable faucet
- [ ] Use strong `SEQ_API_KEY` if Seq is exposed
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Never store private keys server-side
- [ ] Use HTTPS in production (nginx / Cloudflare)
- [ ] Do not store production keys in browser localStorage

## Related

- [Authentication](/clutch-hub-api/authentication)
- [SDK Usage](/clutch-hub-sdk-js/usage)
