---
sidebar_position: 1
---

# Security

## Client-Side Signing

- Private keys **never** leave the user's device
- All transaction signing happens in the browser or mobile app via the SDK
- The API only receives already-signed transactions

## Cryptographic Libraries

- **Signing**: secp256k1 (@noble/secp256k1)
- **Hashing**: Keccak-256
- **Encoding**: RLP

## Replay Protection

- Nonce and timestamp prevent replay attacks
- Each transaction is uniquely identified

## Production Checklist

- [ ] Change `jwt_secret` in API config
- [ ] Use strong `SEQ_API_KEY` if Seq is exposed
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Never store private keys server-side
- [ ] Use HTTPS in production
