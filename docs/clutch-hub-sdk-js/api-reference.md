---
sidebar_position: 4
---

# SDK API Reference

Package: [`clutch-hub-sdk-js`](https://www.npmjs.com/package/clutch-hub-sdk-js) on npm.

## ClutchHubSdk

### Constructor

```typescript
new ClutchHubSdk(apiUrl: string, publicKey: string)
```

### Authentication

| Method | Description |
|--------|-------------|
| `getPublicKey()` | Returns the wallet public key for this instance |
| `isAuthenticated()` | True if a cached JWT exists and is not near expiry |

Token generation is automatic. The SDK caches JWTs globally per public key.

### Unsigned transaction builders

All require authentication (auto `generateToken`). Return `UnsignedTransaction`:

```typescript
interface UnsignedTransaction {
  from: string;
  nonce: number;
  data: object;
}
```

| Method | Args | Description |
|--------|------|-------------|
| `createUnsignedRideRequest(args)` | `RideRequestArgs` | Passenger ride request |
| `createUnsignedRideOffer(args)` | `RideOfferArgs` | Driver offer for a request |
| `createUnsignedRideAcceptance(args)` | `RideAcceptanceArgs` | Passenger accepts offer |
| `createUnsignedRidePay(args)` | `RidePayArgs` | Passenger pays driver (partial OK) |
| `createUnsignedRideCancel(args)` | `RideCancelArgs` | Cancel active trip |
| `createUnsignedRideRequestCancel(args)` | `RideRequestCancelArgs` | Cancel pending request |

### Signing and submission

| Method | Returns | Description |
|--------|---------|-------------|
| `signTransaction(unsignedTx, privateKey)` | `{ r, s, v, rawTransaction, txHash }` | Client-side secp256k1 signing |
| `submitTransaction(rawTransaction)` | `string` | Submits via `sendRawTransaction` mutation |

### Queries

| Method | Description |
|--------|-------------|
| `listRideRequests(bounds?)` | Open ride requests |
| `listRideOffers(rideRequestTxHash)` | Offers for one request |
| `listActiveTrips(options?)` | In-progress trips |
| `listCompletedTrips(options?)` | Fully paid trips |
| `listRecentTrips(options?)` | Completed or cancelled trips |
| `getAccountBalance(publicKey?)` | CLT balance (requires auth) |

Filter options: `{ driverAddress?, passengerAddress? }`.

### Subscriptions

Each returns a **dispose function** — call it to unsubscribe and release the shared WebSocket client.

| Method | Description |
|--------|-------------|
| `subscribeRideRequests(bounds, handlers)` | Live ride request list |
| `subscribeRideOffers(rideRequestTxHash, handlers)` | Offers for one request |
| `subscribeActiveTrips(options, handlers)` | Active trips |
| `subscribeCompletedTrips(options, handlers)` | Completed trips |
| `subscribeRecentTrips(options, handlers)` | Recent finished trips |
| `subscribeAccountBalance(options, handlers)` | Balance updates |

Handlers: `{ onData, onError? }`.

### Faucet

| Method | Description |
|--------|-------------|
| `requestFaucet(recipientAddress)` | `POST /faucet` — returns `FaucetResponse` |

### Utilities

| Export | Description |
|--------|-------------|
| `stripHexPrefix(hex)` | Remove `0x` prefix |
| `normalizeTxHashForRlp(hex)` | Normalize tx hash for RLP encoding |
| `hubGraphqlWsUrl(httpBaseUrl)` | Derive WebSocket URL from HTTP base |
| `getGraphqlWsUrl()` | Instance method — WS URL for this API |

## Types

```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface RideRequestArgs {
  pickup: Coordinates;
  dropoff: Coordinates;
  fare: number;
}

interface RideOfferArgs {
  rideRequestTxHash: string;
  fare: number;
}

interface RideAcceptanceArgs {
  rideOfferTxHash: string;
}

interface RidePayArgs {
  rideAcceptanceTxHash: string;
  fare: number;
}

interface RideCancelArgs {
  rideAcceptanceTxHash: string;
}

interface RideRequestCancelArgs {
  rideRequestTxHash: string;
}

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface AvailableRideRequest {
  txHash: string;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  fare: number;
  passengerAddress: string;
}

interface AvailableRideOffer {
  txHash: string;
  rideRequestTxHash: string;
  fare: number;
  driverAddress: string;
}

interface AvailableActiveTrip {
  txHash: string;
  rideOfferTxHash: string;
  rideRequestTxHash: string;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  fare: number;
  farePaid: number;
  driverAddress: string;
  passengerAddress: string;
}

interface AvailableRecentTrip extends AvailableActiveTrip {
  tripStatus: 'completed' | 'cancelled' | string;
}

interface FaucetResponse {
  ok: boolean;
  amount_clt?: number;
  node?: unknown;
  error?: string;
}
```

## Security

- Private keys never leave the client
- Signing: `@noble/secp256k1` over Keccak-256 hash of unsigned RLP
- Encoding: RLP tags must match the node — see [Transaction Types](/clutch-node/transaction-types)
