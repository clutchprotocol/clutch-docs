---
sidebar_position: 3
---

# GraphQL Reference

The API exposes GraphQL at `POST /graphql`. Subscriptions use `GET /graphql/ws`.

## Quick test

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ listRideRequests { txHash fare passengerAddress } }"}'
```

## Auth matrix

| Field | Auth |
|-------|------|
| `generateToken` | Public |
| `listRideRequests`, `listRideOffers`, `listActiveTrips`, `listCompletedTrips`, `listRecentTrips` | Public |
| `accountBalance` | JWT |
| All `createUnsigned*` mutations, `sendRawTransaction` | JWT |
| Subscription list fields | Public |
| `accountBalanceUpdated` | JWT recommended |

See [Authentication](/clutch-hub-api/authentication) for token usage.

## Types

### Coordinates

```graphql
type Coordinates {
  latitude: Float!
  longitude: Float!
}
```

### MapBoundsInput

Filter ride requests by pickup location inside a map viewport:

```graphql
input MapBoundsInput {
  minLat: Float!
  maxLat: Float!
  minLng: Float!
  maxLng: Float!
}
```

### AvailableRideRequest

```graphql
type AvailableRideRequest {
  txHash: String!
  pickupLocation: Coordinates!
  dropoffLocation: Coordinates!
  fare: Int!
  passengerAddress: String!
  referrer: String
}
```

### AvailableRideOffer

```graphql
type AvailableRideOffer {
  txHash: String!
  rideRequestTxHash: String!
  fare: Int!
  driverAddress: String!
  referrer: String
}
```

### AvailableActiveTrip

Used for active and completed trip lists. Compare `farePaid` to `fare` to see payment progress.

```graphql
type AvailableActiveTrip {
  txHash: String!
  rideOfferTxHash: String!
  rideRequestTxHash: String!
  pickupLocation: Coordinates!
  dropoffLocation: Coordinates!
  fare: Int!
  farePaid: Int!
  driverAddress: String!
  passengerAddress: String!
}
```

### AvailableRecentTrip

Same as active trip plus `tripStatus` (`completed` or `cancelled`).

### Unsigned transaction JSON

Mutations return JSON with this shape (not a GraphQL object type):

```json
{
  "from": "0x...",
  "nonce": 0,
  "data": {
    "function_call_type": "RideRequest",
    "arguments": { }
  }
}
```

Sign client-side, then submit via `sendRawTransaction`.

## Queries

### listRideRequests

Lists open ride requests (not yet accepted). Optional map bounds filter.

```graphql
query ListRideRequests($bounds: MapBoundsInput) {
  listRideRequests(bounds: $bounds) {
    txHash
    pickupLocation { latitude longitude }
    dropoffLocation { latitude longitude }
    fare
    passengerAddress
    referrer
  }
}
```

### listRideOffers

Lists driver offers for a specific ride request.

```graphql
query ListRideOffers($rideRequestTxHash: String!) {
  listRideOffers(rideRequestTxHash: $rideRequestTxHash) {
    txHash
    rideRequestTxHash
    fare
    driverAddress
    referrer
  }
}
```

### listActiveTrips

Trips accepted but not fully paid or cancelled.

```graphql
query ListActiveTrips($driverAddress: String, $passengerAddress: String) {
  listActiveTrips(driverAddress: $driverAddress, passengerAddress: $passengerAddress) {
    txHash
    rideOfferTxHash
    rideRequestTxHash
    fare
    farePaid
    driverAddress
    passengerAddress
  }
}
```

### listCompletedTrips

Trips where full fare has been paid.

### listRecentTrips

Finished trips: completed (full fare paid) or cancelled.

### accountBalance

Requires JWT. Returns CLT balance for `publicKey` (defaults to authenticated wallet).

```graphql
query AccountBalance($publicKey: String) {
  accountBalance(publicKey: $publicKey)
}
```

### Stub queries (do not use)

`userRideRequest` and `rideRequest` return hardcoded placeholder data. Use `listRideRequests` instead.

## Mutations

### generateToken

Public (no JWT), but requires proof of key ownership: a recoverable secp256k1 signature over the challenge `clutch-auth:{publicKey}:{timestamp}`, with `timestamp` within ±120s of server time. See [Authentication](/clutch-hub-api/authentication) for the exact signing rules.

```graphql
mutation GenerateToken($publicKey: String!, $timestamp: Int!, $signature: AuthSignatureInput!) {
  generateToken(publicKey: $publicKey, timestamp: $timestamp, signature: $signature) {
    token
    expiresAt
  }
}
```

```graphql
input AuthSignatureInput {
  r: String!
  s: String!
  v: Int!
}
```

### createUnsignedRideRequest

Passenger creates a ride request. Referrer is injected server-side from config.

```graphql
mutation CreateUnsignedRideRequest(
  $pickupLatitude: Float!, $pickupLongitude: Float!,
  $dropoffLatitude: Float!, $dropoffLongitude: Float!, $fare: Int!
) {
  createUnsignedRideRequest(
    pickupLatitude: $pickupLatitude,
    pickupLongitude: $pickupLongitude,
    dropoffLatitude: $dropoffLatitude,
    dropoffLongitude: $dropoffLongitude,
    fare: $fare
  )
}
```

### createUnsignedRideOffer

Driver offers to fulfill a request.

```graphql
mutation CreateUnsignedRideOffer(
  $rideRequestTransactionHash: String!, $fare: Int!
) {
  createUnsignedRideOffer(
    rideRequestTransactionHash: $rideRequestTransactionHash,
    fare: $fare
  )
}
```

### createUnsignedRideAcceptance

Passenger accepts a driver's offer.

```graphql
mutation CreateUnsignedRideAcceptance($rideOfferTransactionHash: String!) {
  createUnsignedRideAcceptance(rideOfferTransactionHash: $rideOfferTransactionHash)
}
```

### createUnsignedRidePay

Passenger pays the driver (partial payments allowed until fare is covered).

```graphql
mutation CreateUnsignedRidePay(
  $rideAcceptanceTransactionHash: String!, $fare: Int!
) {
  createUnsignedRidePay(
    rideAcceptanceTransactionHash: $rideAcceptanceTransactionHash,
    fare: $fare
  )
}
```

### createUnsignedRideCancel

Either party can cancel an active trip. Refunds unpaid fare. Cannot cancel after full payment.

### createUnsignedRideRequestCancel

Passenger cancels a pending request before acceptance.

### sendRawTransaction

Submit signed RLP hex from client-side signing.

```graphql
mutation SendRawTransaction($rawTransaction: String!) {
  sendRawTransaction(rawTransaction: $rawTransaction)
}
```

Returns node response JSON (includes transaction hash on success).

## Transaction hash linking

Each step references the previous transaction hash:

```
RideRequest (txHash A)
  └── RideOffer (txHash B, links to A)
        └── RideAcceptance (txHash C, links to B)
              └── RidePay (links to C)
```

Cancellation uses the acceptance hash (`RideCancel`) or request hash (`RideRequestCancel`).

## Subscriptions

See [Subscriptions](/clutch-hub-api/subscriptions) for WebSocket setup and poll intervals.
