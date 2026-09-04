---
sidebar_position: 2
---

# Authentication

Clutch Hub API uses **wallet-based JWT authentication**. There is no username/password registration. Your blockchain public key (address) is your identity.

## How it works

1. Build the canonical proof-of-key-ownership challenge `clutch-auth:{chain_id}:{publicKey}:{timestamp}`, where `chain_id` is this hub's chain ID (from its cached `chainInfo`), `publicKey` is the exact string you will pass to the mutation, and `timestamp` is the current Unix time in **seconds**.
2. Sign the challenge with the wallet's private key (see [Challenge signing](#challenge-signing)).
3. Call the public `generateToken(publicKey, timestamp, signature)` GraphQL mutation.
4. The API verifies the timestamp is within **±120 seconds** of server time and that the signature recovers to `publicKey`; only then does it return a JWT signed with HS256 containing a `pk` claim (your public key) and `exp`.
5. Include the token on protected HTTP requests and WebSocket connections.

:::info Why chain_id is in the challenge
The challenge previously carried no chain identity (`clutch-auth:{publicKey}:{timestamp}`). Without it, a challenge signed and captured on one Clutch chain would authenticate the same key on any other Clutch hub, within the ±120s clock-skew window — the signature never said which network it was for. Binding `chain_id` into the message closes that: a challenge built for one chain fails to verify against another. There is no fallback to the old chain_id-less format.
:::

The SDK does all of this automatically via `ensureAuth()` when you use authenticated methods — provide the wallet's private key to the `ClutchHubSdk` constructor (or `setPrivateKey`), and pass `chainId` as the constructor's fourth argument so the SDK can build the correct challenge. See [SDK API Reference](/clutch-hub-sdk-js/api-reference#chain_id-and-verifyunsignedtransaction).

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

1. `message = "clutch-auth:" + chainId + ":" + publicKey + ":" + timestamp` (`publicKey` byte-for-byte as sent in the mutation).
2. `hashHex = hex(keccak256(utf8(message)))` — 64-char lowercase hex, no `0x`.
3. Sign `keccak256(utf8(hashHex))` — Keccak-256 over the UTF-8 bytes of the hex *string* — with recoverable secp256k1; `v = recoveryId + 27`.

In the SDK this is exposed as `signAuthChallenge(chainId, publicKey, timestamp, privateKey)` (with helpers `buildAuthChallengeMessage(chainId, publicKey, timestamp)` and `authChallengeHashHex(chainId, publicKey, timestamp)`). `chainId` should come from your app's own configuration — the same value passed to the `ClutchHubSdk` constructor — not from a value read back from the server.

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

**All** subscriptions work without a token — none of them carry an auth guard, including `accountBalanceUpdated`. The SDK sends a token when available but still connects if token generation fails.

## Auth requirements by operation

| Operation | Auth required |
|-----------|---------------|
| `generateToken` | No JWT (requires a signed proof-of-key-ownership challenge instead) |
| `chainInfo` (query) | No |
| `listRideRequests`, `listRideOffers`, `listActiveTrips`, `listCompletedTrips`, `listRecentTrips` | No |
| `rideRequestsUpdated`, `rideOffersUpdated`, `activeTripsUpdated`, `completedTripsUpdated`, `recentTripsUpdated` | No |
| `accountBalance` (query) | Yes |
| `accountBalanceUpdated` (subscription) | No — **no guard on this subscription**; any client can stream any address's balance by passing its `publicKey` |
| All `createUnsigned*` mutations (including `createUnsignedBurn`) | Yes |
| `sendRawTransaction` | Yes |
| `userRideRequests`, `rideRequest` | Yes / No (stubs — do not use) |
