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
| `chainInfo` | Public |
| `listRideRequests`, `listRideOffers`, `listActiveTrips`, `listCompletedTrips`, `listRecentTrips` | Public |
| `accountBalance`, `userRideRequests` | JWT |
| All `createUnsigned*` mutations (including `createUnsignedBurn`), `sendRawTransaction` | JWT |
| Subscription list fields | Public |
| `accountBalanceUpdated` | Public — **not enforced**; no guard on any subscription |

See [Authentication](/clutch-hub-api/authentication) for token usage.

:::info Fare, amount, and balance scalars are String
Every fare, amount, and balance field below is `String`, not `Int`. GraphQL's `Int` is a 32-bit signed integer; at the 1 USD = 1,000,000 CLT peg, a fare above roughly **$2,147** (`2,147 × 1,000,000 ≈ 2^31`) would overflow it. Every such field crosses the wire as a decimal string instead — parse it into your language's arbitrary-precision integer type (`bigint` in the SDK) rather than a native `number`/`Int`.
:::

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
  fare: String!
  passengerAddress: String!
  referrer: String
}
```

### AvailableRideOffer

```graphql
type AvailableRideOffer {
  txHash: String!
  rideRequestTxHash: String!
  fare: String!
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
  fare: String!
  farePaid: String!
  driverAddress: String!
  passengerAddress: String!
}
```

### AvailableRecentTrip

Same as active trip plus `tripStatus` (`completed` or `cancelled`).

### ChainInfo

Genesis-committed chain parameters, cached by the Hub API at startup (not re-fetched from the node per request — a chain swap requires an API restart to pick up new values).

```graphql
type ChainInfo {
  chainId: String!
  isTestnet: Boolean!
  txFee: String!
  totalSupply: String!
  mintAuthority: String!
}
```

`chainId` and `txFee` are stringified for schema consistency with the rest of this API's numeric fields, even though neither can realistically overflow `Int`. `totalSupply` **must** be a string — see the peg discussion in [CLT Economics](/clutch-node/clt-economics#the-peg).

Note this type does **not** include a block-index field. The underlying node RPC (`get_chain_info`) also returns `latest_block_index`, but the Hub API does not currently forward it through `chainInfo` — query `get_block_by_index` via the node directly, or watch the explorer, if you need the current height.

### Unsigned transaction JSON

Mutations return JSON with this shape (not a GraphQL object type):

```json
{
  "from": "0x...",
  "nonce": 0,
  "chain_id": 2077,
  "data": {
    "function_call_type": "RideRequest",
    "arguments": { }
  }
}
```

Every `createUnsigned*` mutation now includes `chain_id`, fetched by the Hub API at startup and cached — the same value returned by `chainInfo.chainId`. Sign client-side (the SDK's `verifyUnsignedTransaction` can check this blob against what you asked for before signing — see [SDK API Reference](/clutch-hub-sdk-js/api-reference#chain_id-and-verifyunsignedtransaction)), then submit via `sendRawTransaction`.

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

Requires JWT. Returns CLT balance (as a `String` — see the scalar note above) for `publicKey` (defaults to authenticated wallet).

```graphql
query AccountBalance($publicKey: String) {
  accountBalance(publicKey: $publicKey)
}
```

### chainInfo

Public. Genesis-committed chain parameters, cached at Hub API startup — see [ChainInfo](#chaininfo) above.

```graphql
query ChainInfo {
  chainInfo {
    chainId
    isTestnet
    txFee
    totalSupply
    mintAuthority
  }
}
```

### Stub queries (do not use)

`userRideRequests` (requires JWT) and `rideRequest` (public) return hardcoded placeholder data. Use `listRideRequests` instead.

## Mutations

### generateToken

Public (no JWT), but requires proof of key ownership: a recoverable secp256k1 signature over the challenge `clutch-auth:{chain_id}:{publicKey}:{timestamp}`, with `timestamp` within ±120s of server time. See [Authentication](/clutch-hub-api/authentication) for the exact signing rules.

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
  $dropoffLatitude: Float!, $dropoffLongitude: Float!, $fare: String!
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
  $rideRequestTransactionHash: String!, $fare: String!
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
  $rideAcceptanceTransactionHash: String!, $fare: String!
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

### createUnsignedBurn

Destroys `amount` CLT from the caller's own balance — permissionless, any authenticated wallet may burn its own CLT. `redemptionRef` is optional: supply `hex(keccak256(intentId))` when this burn corresponds to an off-chain redemption an operator's payout worker needs to match; omit it for a plain burn with no off-chain counterpart.

```graphql
mutation CreateUnsignedBurn($amount: String!, $redemptionRef: String) {
  createUnsignedBurn(amount: $amount, redemptionRef: $redemptionRef)
}
```

:::note No createUnsignedMint
There is no corresponding `createUnsignedMint` mutation. Minting is authority-gated (only the chain's configured `mint_authority` may sign one) and is not exposed through the Hub API on this release — it is constructed and signed directly against the node by whatever holds the mint authority key. See [Transaction Types — Mint](/clutch-node/transaction-types#mint-tag-6).
:::

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
