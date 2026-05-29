---
sidebar_position: 2
---

# Authentication

Clutch Hub API uses **wallet-based JWT authentication**. There is no username/password registration. Your blockchain public key (address) is your identity.

## How it works

1. Call the public `generateToken(publicKey)` GraphQL mutation.
2. The API returns a JWT signed with HS256 containing a `pk` claim (your public key) and `exp`.
3. Include the token on protected HTTP requests and WebSocket connections.

The SDK calls `generateToken` automatically via `ensureAuth()` when you use authenticated methods.

## generateToken

```graphql
mutation GenerateToken($publicKey: String!) {
  generateToken(publicKey: $publicKey) {
    token
    expiresAt
  }
}
```

`expiresAt` is a Unix timestamp in **seconds**.

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
| `generateToken` | No |
| `listRideRequests`, `listRideOffers`, `listActiveTrips`, `listCompletedTrips`, `listRecentTrips` | No |
| `rideRequestsUpdated`, `rideOffersUpdated`, `activeTripsUpdated`, `completedTripsUpdated`, `recentTripsUpdated` | No |
| `accountBalance`, `accountBalanceUpdated` | Yes |
| All `createUnsigned*` mutations | Yes |
| `sendRawTransaction` | Yes |
| `userRideRequest`, `rideRequest` | Yes / No (stubs — do not use) |

:::note
`POST /faucet` does not require a JWT. It is gated by server config (`faucet_enabled`) instead.
:::
