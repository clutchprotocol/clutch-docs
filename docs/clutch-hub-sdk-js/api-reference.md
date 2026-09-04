---
sidebar_position: 4
---

# SDK API Reference

Package: [`clutch-hub-sdk-js`](https://www.npmjs.com/package/clutch-hub-sdk-js) on npm.

:::warning v3 breaking changes
This version changes three things that will break code written against v2: amounts are now `bigint` instead of `number`, `chain_id` is threaded through auth and signing, and the wire RLP format grew by one field. See [v3 breaking changes](#v3-breaking-changes) at the bottom of this page before upgrading.
:::

## ClutchHubSdk

### Constructor

```typescript
new ClutchHubSdk(apiUrl: string, publicKey: string, privateKey?: string, chainId?: number)
```

`chainId` is new in v3 and **optional**, but you should pass it for anything beyond read-only queries: it is the value the SDK pins locally for both the auth challenge and [`verifyUnsignedTransaction`](#chain_id-and-verifyunsignedtransaction). Get it from your own app configuration — never from a value read back from the hub, since that would defeat the point of pinning it. Omitting `chainId` still lets you call read-only methods, but `signTransaction` throws if you later try to pass an `expected` verification argument without a pinned `chainId` available from somewhere.

### Authentication

| Method | Description |
|--------|-------------|
| `getPublicKey()` | Returns the wallet public key for this instance |
| `setPrivateKey(privateKey)` | Provide/replace the private key used to sign auth challenges |
| `isAuthenticated()` | True if a cached JWT exists and is not near expiry |

Token generation is automatic, but requires the wallet's private key (constructor or `setPrivateKey`): `generateToken` demands a recoverable secp256k1 signature over the challenge `clutch-auth:{chainId}:{publicKey}:{timestamp}` (timestamp within ±120s of server time). The key is used for local signing only and never leaves the client. The SDK caches JWTs globally per public key. Standalone helpers `buildAuthChallengeMessage(chainId, publicKey, timestamp)`, `authChallengeHashHex(chainId, publicKey, timestamp)`, and `signAuthChallenge(chainId, publicKey, timestamp, privateKey)` are exported for custom clients.

### Unsigned transaction builders

All require authentication (auto `generateToken`). Return `UnsignedTransaction`:

```typescript
interface UnsignedTransaction {
  from: string;
  nonce: number;
  chain_id: number;
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
| `createUnsignedBurn(args)` | `BurnArgs` | Destroy CLT from your own balance (optionally tagged for redemption) |

:::note No createUnsignedMint
The SDK does not expose a Mint builder. Minting is gated to the chain's `mint_authority` and is constructed directly against the node by whoever holds that key — it is out of scope for an app-facing client SDK. See [Transaction Types](/clutch-node/transaction-types#mint-tag-6).
:::

### Signing and submission

| Method | Returns | Description |
|--------|---------|-------------|
| `signTransaction(unsignedTx, privateKey, expected?)` | `{ r, s, v, rawTransaction, txHash }` | Client-side secp256k1 signing, with optional pre-sign verification |
| `submitTransaction(rawTransaction)` | `string` | Submits via `sendRawTransaction` mutation |

See [chain_id and verifyUnsignedTransaction](#chain_id-and-verifyunsignedtransaction) for the `expected` argument.

### Queries

| Method | Description |
|--------|-------------|
| `listRideRequests(bounds?)` | Open ride requests |
| `listRideOffers(rideRequestTxHash)` | Offers for one request |
| `listActiveTrips(options?)` | In-progress trips |
| `listCompletedTrips(options?)` | Fully paid trips |
| `listRecentTrips(options?)` | Completed or cancelled trips |
| `getAccountBalance(publicKey?)` | CLT balance, as `bigint` (requires auth) |

Filter options: `{ driverAddress?, passengerAddress? }`.

:::note No getChainInfo
The SDK has no chain-info method — `ChainInfo` under [Types](#types) is exported for typing a manual query, but nothing in the SDK produces one. Query the hub's `chainInfo` GraphQL field directly if you need genesis-committed parameters for display:

```graphql
query {
  chainInfo {
    chainId
    isTestnet
    txFee
    totalSupply
    mintAuthority
  }
}
```

Don't use the result to set the SDK's `chainId`: as [above](#chain_id-and-verifyunsignedtransaction), that value must come from your own app configuration, never read back from the hub.
:::

### Subscriptions

Each returns a **dispose function** — call it to unsubscribe and release the shared WebSocket client.

| Method | Description |
|--------|-------------|
| `subscribeRideRequests(bounds, handlers)` | Live ride request list |
| `subscribeRideOffers(rideRequestTxHash, handlers)` | Offers for one request |
| `subscribeActiveTrips(options, handlers)` | Active trips |
| `subscribeCompletedTrips(options, handlers)` | Completed trips |
| `subscribeRecentTrips(options, handlers)` | Recent finished trips |
| `subscribeAccountBalance(options, handlers)` | Balance updates, delivered as `bigint` |

Handlers: `{ onData, onError? }`.

### Utilities

| Export | Description |
|--------|-------------|
| `stripHexPrefix(hex)` | Remove `0x` prefix |
| `normalizeTxHashForRlp(hex)` | Normalize tx hash for RLP encoding |
| `hubGraphqlWsUrl(httpBaseUrl)` | Derive WebSocket URL from HTTP base |
| `getGraphqlWsUrl()` | Instance method — WS URL for this API |
| `formatUsd(microUsd)` | Format a `bigint` CLT amount as a `$`-prefixed USD string — see [below](#formatusd) |

## chain_id and verifyUnsignedTransaction

Two related v3 additions close the same gap: previously, the SDK signed whatever unsigned-transaction blob the hub returned, on trust. Client-side signing kept the **private key** off the wire, but it did nothing to confirm the hub actually built the transaction the app asked for — a compromised or buggy hub could swap in a different fare, a different reference, or a different `chain_id`, and the SDK would sign it anyway.

### chain_id

Pass `chainId` to the `ClutchHubSdk` constructor. This value is used for:

1. The auth challenge (`clutch-auth:{chainId}:{publicKey}:{timestamp}`)
2. The expected value inside `verifyUnsignedTransaction`, when you request verification

It is **never** read from the hub's own `chainInfo` response for either purpose — asking the untrusted party what chain it claims to be defeats the point of pinning `chain_id` client-side. Get it from your own app configuration (an env var, a build-time constant — wherever your app already knows which network it's pointed at).

### verifyUnsignedTransaction

```typescript
function verifyUnsignedTransaction(
  unsignedTx: UnsignedTransaction,
  expected: ExpectedTx
): VerifiedTx
```

```typescript
interface ExpectedTx {
  type: 'RideRequest' | 'RideOffer' | 'RidePay' | 'RideAcceptance' | 'RideCancel' | 'RideRequestCancel' | 'Burn';
  from?: string;
  chainId?: number;
  fare?: bigint;
  amount?: bigint;
  refTxHash?: string;
  redemptionRef?: string;
}

interface VerifiedTx {
  referrer: string | null;
}
```

A pure, side-effect-free function that checks the hub-returned `unsignedTx` against what you expected to ask for: `from`, `chain_id` (strict equality against your pinned value, not just "is it present"), the transaction type, `fare`/`amount`, and any transaction-hash reference or redemption ref. It throws `Error('unsigned tx does not match request: <field>')` naming the first mismatched field.

`referrer` is deliberately **not** part of verification — it is returned on `VerifiedTx` for display only. The hub injects the referrer server-side, and there is currently no signed-quote flow that would let a client verify it was set correctly; surfacing it to the user before they sign is the interim mitigation, not a guarantee.

You don't call `verifyUnsignedTransaction` directly in normal use — pass `expected` as `signTransaction`'s third argument and it runs internally before the RLP preimage is built:

```javascript
const unsigned = await sdk.createUnsignedBurn({ amount: 5_000_000n, redemptionRef: myRef });

const signed = await sdk.signTransaction(unsigned, privateKey, {
  type: 'Burn',
  amount: 5_000_000n,
  redemptionRef: myRef,
});
```

`from` and `chainId` inside `expected` are filled in automatically from the SDK instance if you omit them. If verification fails, `signTransaction` throws before signing anything. Omitting the `expected` argument entirely skips verification — the pre-v3 behavior — which remains the default so existing calls don't break, but means you're back to trusting the hub's blob unseen.

## formatUsd

```typescript
function formatUsd(microUsd: bigint): string
```

Formats a raw CLT amount (a `bigint`, in micro-USD base units) as a `$`-prefixed decimal string for display, e.g. `formatUsd(5_000_000n) === '$5.00'`. Uses integer division throughout — never floats, since a float division would reintroduce the precision loss `bigint` amounts exist to avoid — and truncates (floors) the cents rather than rounding, consistent with CLT having no sub-unit. Negative amounts get a leading `-`; dollar amounts get thousands separators.

## Types

```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface RideRequestArgs {
  pickup: Coordinates;
  dropoff: Coordinates;
  /** CLT base units (1 USD = 1,000,000 CLT). bigint — a number loses precision above 2^53. */
  fare: bigint;
}

interface RideOfferArgs {
  rideRequestTxHash: string;
  fare: bigint;
}

interface RideAcceptanceArgs {
  rideOfferTxHash: string;
}

interface RidePayArgs {
  rideAcceptanceTxHash: string;
  fare: bigint;
}

interface RideCancelArgs {
  rideAcceptanceTxHash: string;
}

interface RideRequestCancelArgs {
  rideRequestTxHash: string;
}

interface BurnArgs {
  /** CLT base units to burn. */
  amount: bigint;
  /** hex(keccak256(intent_id)) for treasury redemptions; omit for a plain burn. */
  redemptionRef?: string;
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
  fare: bigint;
  passengerAddress: string;
}

interface AvailableRideOffer {
  txHash: string;
  rideRequestTxHash: string;
  fare: bigint;
  driverAddress: string;
}

interface AvailableActiveTrip {
  txHash: string;
  rideOfferTxHash: string;
  rideRequestTxHash: string;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  fare: bigint;
  farePaid: bigint;
  driverAddress: string;
  passengerAddress: string;
}

interface AvailableRecentTrip extends AvailableActiveTrip {
  tripStatus: 'completed' | 'cancelled' | string;
}

interface ChainInfo {
  chainId: bigint;
  isTestnet: boolean;
  txFee: bigint;
  totalSupply: bigint;
  mintAuthority: string;
}
```

## v3 breaking changes

- **Amounts are `bigint`, not `number`.** Every `fare`/`amount`/`farePaid` field, on both builder args and query/subscription results, is now `bigint`. A plain `number` silently rounds above `2^53` — at this release's peg, that's a real, reachable amount, not a theoretical edge case, so the old `number` typing meant a fare could already be lossy *before* it was ever signed. Update call sites to pass `5_000_000n` instead of `5000000`, and convert display values with [`formatUsd`](#formatusd) rather than dividing manually.
- **`chain_id` is required for signing and auth to be meaningful.** Pass `chainId` to the constructor. Transactions still sign without it (the SDK trusts the hub's `unsignedTx.chain_id` for the actual RLP encoding), but you lose the ability to verify that value against anything, and auth challenges built without a pinned `chainId` default to `0`, which will not match any real chain's genesis.
- **The signed wire format gained a field.** `chain_id` sits at index 2 of both the unsigned preimage (now 4 items) and the signed payload (now 8 items) — see [Signing and Encoding](/reference/signing-and-encoding). If you hand-roll RLP encoding instead of using `signTransaction`, this is a hard compatibility break: old 7-item signed transactions are rejected by a `treasury-break`-or-later node.
- **New: `createUnsignedBurn` and `verifyUnsignedTransaction`.** Neither existed in v2.
- **GraphQL fare/amount variables are `String`, not `Int`.** If you construct GraphQL requests yourself instead of using the SDK's builder methods, update your variable types.

## Security

- Private keys never leave the client
- Signing: `@noble/secp256k1` over Keccak-256 hash of unsigned RLP
- Encoding: RLP tags must match the node — see [Transaction Types](/clutch-node/transaction-types)
- `chain_id` in the signed payload prevents a transaction (or auth challenge) built for one chain from being replayed on another
