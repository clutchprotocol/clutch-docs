---
sidebar_position: 5
---

# SDK Subscriptions

The SDK provides WebSocket subscriptions that mirror Hub API GraphQL subscription fields.

## Pattern

Every subscription method returns a **dispose function**. Call it to unsubscribe and release the shared WebSocket connection.

```javascript
const dispose = sdk.subscribeRideRequests(null, {
  onData: (items) => {
    // items is an array — full snapshot each tick
  },
  onError: (err) => {
    console.error('Subscription error:', err);
  },
});

// When done (e.g. React useEffect cleanup):
dispose();
```

## Methods

| Method | Arguments | Emits |
|--------|-----------|-------|
| `subscribeRideRequests(bounds, handlers)` | `MapBounds \| null` | `AvailableRideRequest[]` |
| `subscribeRideOffers(rideRequestTxHash, handlers)` | request tx hash | `AvailableRideOffer[]` |
| `subscribeActiveTrips(options, handlers)` | `{ driverAddress?, passengerAddress? }` | `AvailableActiveTrip[]` |
| `subscribeCompletedTrips(options, handlers)` | filter options | `AvailableCompletedTrip[]` |
| `subscribeRecentTrips(options, handlers)` | filter options | `AvailableRecentTrip[]` |
| `subscribeAccountBalance(options, handlers)` | `{ publicKey? }` | `number` (CLT balance) |

## Connection sharing

The SDK maintains one `graphql-ws` client per `(apiUrl, publicKey)` pair. Multiple subscriptions share a single WebSocket with reference counting.

JWT is sent in `connection_init` when available. Public subscriptions still work if token generation fails.

## WebSocket URL

```javascript
const wsUrl = sdk.getGraphqlWsUrl();
// http://localhost:3000 → ws://localhost:3000/graphql/ws
```

Or use the standalone helper:

```javascript
import { hubGraphqlWsUrl } from 'clutch-hub-sdk-js';
const wsUrl = hubGraphqlWsUrl('https://api-stage.clutchprotocol.io');
```

## Example: driver dashboard

```javascript
const driverSdk = new ClutchHubSdk(API_URL, driverPublicKey);

// Watch all open requests
const disposeRequests = driverSdk.subscribeRideRequests(null, {
  onData: (requests) => renderRequestList(requests),
});

// When user selects a request, watch its offers
let disposeOffers = () => {};
function selectRequest(txHash) {
  disposeOffers();
  disposeOffers = driverSdk.subscribeRideOffers(txHash, {
    onData: (offers) => renderOffers(offers),
  });
}
```

## Polling fallback

Subscriptions are poll-based on the server (~1s intervals). For critical UX, combine with one-shot queries:

```javascript
// Immediate fetch + subscription
const initial = await sdk.listRideRequests();
renderRequestList(initial);

sdk.subscribeRideRequests(null, {
  onData: renderRequestList,
});
```

The demo app uses this pattern in `sdkRealtime.js` with HTTP polling fallback when WebSocket fails.

## Related

- [API Subscriptions](/clutch-hub-api/subscriptions)
- [Ride Lifecycle](/getting-started/ride-lifecycle)
