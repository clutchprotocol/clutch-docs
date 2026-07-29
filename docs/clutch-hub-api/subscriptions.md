---
sidebar_position: 5
---

# GraphQL Subscriptions

Real-time updates use GraphQL subscriptions over WebSocket at `GET /graphql/ws`.

## Protocol

The API uses the [`graphql-transport-ws`](https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md) protocol. Client libraries like [`graphql-ws`](https://github.com/enisdenjo/graphql-ws) are supported.

Send header or subprotocol:

```
Sec-WebSocket-Protocol: graphql-transport-ws
```

## Authentication

Optional JWT in `connection_init`:

```json
{
  "Authorization": "Bearer YOUR_JWT"
}
```

Public list subscriptions work without a token. `accountBalanceUpdated` should include a token.

The SDK handles connection setup automatically via `subscribe*` methods.

:::info fare, farePaid, and balance are String
As in the [GraphQL reference](/clutch-hub-api/graphql), every fare/balance field emitted by a subscription is a `String`, not an `Int` — the peg (1 USD = 1,000,000 CLT) can push a fare past 32-bit `Int` range. Parse into a `bigint` (or your language's arbitrary-precision integer) rather than a native number.
:::

## How subscriptions work

Subscriptions are **poll-based snapshots** from the node, not push events from the chain:

| Subscription | Mirrors query | Poll interval |
|--------------|---------------|---------------|
| `rideRequestsUpdated` | `listRideRequests` | ~1 second |
| `rideOffersUpdated` | `listRideOffers` | ~0.5 seconds |
| `activeTripsUpdated` | `listActiveTrips` | ~1 second |
| `completedTripsUpdated` | `listCompletedTrips` | ~1 second |
| `recentTripsUpdated` | `listRecentTrips` | ~1 second |
| `accountBalanceUpdated` | `accountBalance` | ~1 second |

The first snapshot is sent immediately; subsequent updates follow the interval.

## Examples

### Ride requests

```graphql
subscription RideRequestsUpdated($bounds: MapBoundsInput) {
  rideRequestsUpdated(bounds: $bounds) {
    txHash
    pickupLocation { latitude longitude }
    dropoffLocation { latitude longitude }
    fare
    passengerAddress
  }
}
```

### Ride offers for one request

```graphql
subscription RideOffersUpdated($rideRequestTxHash: String!) {
  rideOffersUpdated(rideRequestTxHash: $rideRequestTxHash) {
    txHash
    rideRequestTxHash
    fare
    driverAddress
  }
}
```

### Active trips

```graphql
subscription ActiveTripsUpdated($driverAddress: String, $passengerAddress: String) {
  activeTripsUpdated(driverAddress: $driverAddress, passengerAddress: $passengerAddress) {
    txHash
    fare
    farePaid
    driverAddress
    passengerAddress
  }
}
```

### Account balance

```graphql
subscription AccountBalanceUpdated($publicKey: String!) {
  accountBalanceUpdated(publicKey: $publicKey)
}
```

## SDK usage

```javascript
const dispose = sdk.subscribeRideOffers(requestTxHash, {
  onData: (offers) => console.log('Offers:', offers),
  onError: (err) => console.error(err),
});

// Cleanup when component unmounts:
dispose();
```

The SDK multiplexes subscriptions over one shared WebSocket per API URL + wallet.

## WebSocket URL

Derive from HTTP base URL:

- `http://localhost:3000` → `ws://localhost:3000/graphql/ws`
- `https://api-stage.clutchprotocol.io` → `wss://api-stage.clutchprotocol.io/graphql/ws`

Use `sdk.getGraphqlWsUrl()` or the exported `hubGraphqlWsUrl(baseUrl)` helper.

## Fallback pattern

The demo app falls back to HTTP polling if WebSocket subscriptions fail. For production apps, implement a similar fallback for unreliable networks.

See [SDK Subscriptions](/clutch-hub-sdk-js/subscriptions) for all SDK methods.
