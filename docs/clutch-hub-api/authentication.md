---
sidebar_position: 2
---

# Authentication

Clutch Hub API uses **wallet-based JWT authentication**. There is no username/password registration. Your blockchain public key (address) is your identity.

## How it works

1. Build the canonical proof-of-key-ownership challenge `clutch-auth:{publicKey}:{timestamp}`, where `publicKey` is the exact string you will pass to the mutation and `timestamp` is the current Unix time in **seconds**.
2. Sign the challenge with the wallet's private key (see [Challenge signing](#challenge-signing)).
3. Call the public `generateToken(publicKey, timestamp, signature)` GraphQL mutation.
4. The API verifies the timestamp is within **±120 seconds** of server time and that the signature recovers to `publicKey`; only then does it return a JWT signed with HS256 containing a `pk` claim (your public key) and `exp`.
5. Include the token on protected HTTP requests and WebSocket connections.

The SDK does all of this automatically via `ensureAuth()` when you use authenticated methods — provide the wallet's private key to the `ClutchHubSdk` constructor (or `setPrivateKey`).

## generateToken

```graphql
mutation GenerateToken($publicKey: String!, $timestamp: Int!, $signature: AuthSignatureInput!) {
  generateToken(publicKey: $publicKey, timestamp: $timestamp, signature: $signature) {
    token
    expiresAt
  }
}
```

- `publicKey` — wallet address (`0x` + 40 hex) or uncompressed public key (130 hex).
- `timestamp` — Unix seconds; rejected if more than ±120s from server time (stateless replay window).
- `signature` — `{ r, s, v }`: recoverable secp256k1 signature over the challenge (`r`/`s` 32-byte hex, `0x` optional; `v` 27 or 28).

`expiresAt` is a Unix timestamp in **seconds**.

## Challenge signing

The signature follows the same convention as [transaction signing](/reference/signing-and-encoding):

1. `message = "clutch-auth:" + publicKey + ":" + timestamp` (`publicKey` byte-for-byte as sent in the mutation).
2. `hashHex = hex(keccak256(utf8(message)))` — 64-char lowercase hex, no `0x`.
3. Sign `keccak256(utf8(hashHex))` — Keccak-256 over the UTF-8 bytes of the hex *string* — with recoverable secp256k1; `v = recoveryId + 27`.

In the SDK this is exposed as `signAuthChallenge(publicKey, timestamp, privateKey)` (with helpers `buildAuthChallengeMessage` and `authChallengeHashHex`).

## HTTP requests

For protected GraphQL operations, send:

```
Authorization: Bearer <token>
```

Example with curl:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"query":"mutation { sendRawTransaction(rawTransaction: \"0x...\") }"}'
```

## WebSocket subscriptions

GraphQL subscriptions use `GET /graphql/ws` with the [`graphql-transport-ws`](https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md) protocol.

Send the JWT in the `connection_init` payload:

```json
{
  "Authorization": "Bearer YOUR_JWT"
}
```

Public list subscriptions work **without** a token. The SDK sends a token when available but still connects if token generation fails.

## Auth requirements by operation

| Operation | Auth required |
|-----------|---------------|
| `generateToken` | No JWT (requires a signed proof-of-key-ownership challenge instead) |
| `listRideRequests`, `listRideOffers`, `listActiveTrips`, `listCompletedTrips`, `listRecentTrips` | No |
| `rideRequestsUpdated`, `rideOffersUpdated`, `activeTripsUpdated`, `completedTripsUpdated`, `recentTripsUpdated` | No |
| `accountBalance`, `accountBalanceUpdated` | Yes |
| All `createUnsigned*` mutations | Yes |
| `sendRawTransaction` | Yes |
| `userRideRequest`, `rideRequest` | Yes / No (stubs — do not use) |

:::note
`POST /faucet` does not require a JWT. It is gated by server config (`faucet_enabled`) instead.
:::
