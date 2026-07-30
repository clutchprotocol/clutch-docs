---
sidebar_position: 3
---

# SDK Usage

## Installation

```bash
npm install clutch-hub-sdk-js
```

## Create an SDK instance

```javascript
import { ClutchHubSdk } from 'clutch-hub-sdk-js';

const API_URL = 'http://localhost:3000';
const publicKey = '0xYourPublicKey';
const privateKey = '0xYourPrivateKey';
const CHAIN_ID = 2077; // from your own app config, never from the hub

const sdk = new ClutchHubSdk(API_URL, publicKey, privateKey, CHAIN_ID);
```

The constructor requires the API URL and the wallet public key. Pass the private key as the third argument (or later via `sdk.setPrivateKey(privateKey)`) if you will call authenticated methods: the SDK automatically obtains a JWT via `generateToken`, which requires signing a proof-of-key-ownership challenge (`clutch-auth:{chainId}:{publicKey}:{timestamp}`) with the private key. The key is used locally for signing only and is never sent to the API. Read-only usage (public `list*` queries and subscriptions) works without it.

The fourth argument, `chainId`, is new in this SDK version. Pin it to the network your app targets — it's used both to build the auth challenge above and, optionally, to verify a hub-returned transaction before you sign it (see [Verify before you sign](#verify-before-you-sign)).

## Basic transaction flow

Every on-chain action follows the same pattern:

1. **Create unsigned tx** — API builds payload and fetches nonce
2. **Sign client-side** — private key never leaves your app
3. **Submit** — send raw RLP hex to the network

```javascript
const unsigned = await sdk.createUnsignedRideRequest({
  pickup: { latitude: 35.7, longitude: 51.4 },
  dropoff: { latitude: 35.8, longitude: 51.5 },
  fare: 5_000_000n, // $5.00 — amounts are bigint, at 1 USD = 1,000,000 CLT
});

const signed = await sdk.signTransaction(unsigned, privateKey);
const result = await sdk.submitTransaction(signed.rawTransaction);

console.log('Submitted:', signed.txHash, result);
```

:::info Amounts are bigint
Every fare/amount field is a `bigint`, not a `number` — write `5_000_000n`, not `5000000`. A `number` silently loses precision above `2^53`, which is a reachable fare at this peg, not just a theoretical ceiling. Use [`formatUsd`](/clutch-hub-sdk-js/api-reference#formatusd) to render one for display.
:::

## Verify before you sign

`signTransaction` accepts an optional third argument describing what you expected to build. When present, the SDK checks the hub-returned unsigned transaction against it — type, fare/amount, references, `from`, and `chain_id` (checked against the value pinned in the constructor, never against anything the hub itself reports) — and throws before signing if anything doesn't match:

```javascript
const unsigned = await sdk.createUnsignedRideRequest({
  pickup: { latitude: 35.7, longitude: 51.4 },
  dropoff: { latitude: 35.8, longitude: 51.5 },
  fare: 5_000_000n,
});

const signed = await sdk.signTransaction(unsigned, privateKey, {
  type: 'RideRequest',
  fare: 5_000_000n,
});
```

Previously the SDK signed whatever the hub returned, unseen — client-side signing kept the private key off the wire but didn't confirm the hub built the transaction you actually asked for. This closes that gap for everything except the `referrer` field, which the hub injects server-side and which the SDK surfaces on the result for display rather than verifying (there's no signed-quote flow yet that would let a client confirm it). Omitting the third argument skips verification entirely, matching pre-v3 behavior.

## Burn (redeem CLT)

```javascript
const unsigned = await sdk.createUnsignedBurn({
  amount: 2_000_000n, // $2.00
  redemptionRef: myRedemptionIntentHash, // optional — omit for a plain burn
});

const signed = await sdk.signTransaction(unsigned, privateKey, {
  type: 'Burn',
  amount: 2_000_000n,
  redemptionRef: myRedemptionIntentHash,
});

await sdk.submitTransaction(signed.rawTransaction);
```

Burning is permissionless — any wallet may destroy its own CLT. `redemptionRef` is optional: supply it (a hex-encoded hash of an off-chain redemption intent) when an operator's payout process needs to match this burn to a withdrawal request; omit it for a burn with no off-chain counterpart. There is no corresponding `createUnsignedMint` — minting is restricted to the chain's `mint_authority` and isn't exposed through this SDK. See [CLT Economics](/clutch-node/clt-economics) for why mint/burn are the only two operations that change total supply.

## Get test CLT (faucet)

On test networks with faucet enabled:

```javascript
const res = await sdk.requestFaucet(publicKey);
if (res.ok) {
  console.log('Received', res.amount_clt, 'CLT');
} else {
  console.error(res.error);
}
```

## Full ride lifecycle (passenger + driver)

See the [Ride Lifecycle guide](/getting-started/ride-lifecycle) for a complete walkthrough.

Summary of SDK calls:

| Step | Role | SDK method |
|------|------|------------|
| Request ride | Passenger | `createUnsignedRideRequest` |
| Cancel request | Passenger | `createUnsignedRideRequestCancel` |
| Submit offer | Driver | `createUnsignedRideOffer` |
| Accept offer | Passenger | `createUnsignedRideAcceptance` |
| Pay fare | Passenger | `createUnsignedRidePay` |
| Cancel trip | Either | `createUnsignedRideCancel` |

Each write operation: `signTransaction` → `submitTransaction`.

## Query chain state

```javascript
const requests = await sdk.listRideRequests();
const offers = await sdk.listRideOffers(requestTxHash);
const active = await sdk.listActiveTrips({ passengerAddress: publicKey });
const balance = await sdk.getAccountBalance(); // bigint
const info = await sdk.getChainInfo();
console.log(`chain ${info.chainId}, tx_fee ${formatUsd(info.txFee)}, supply ${formatUsd(info.totalSupply)}`);
```

## Real-time updates

```javascript
const dispose = sdk.subscribeRideRequests(null, {
  onData: (requests) => console.log('Requests:', requests),
  onError: (err) => console.error(err),
});

// When done:
dispose();
```

See [SDK Subscriptions](/clutch-hub-sdk-js/subscriptions) for all subscription methods.

## Coordinates

Both formats work for pickup/dropoff:

```javascript
{ latitude: 35.7, longitude: 51.4 }
{ lat: 35.7, lng: 51.4 }
```

## Creating a wallet

The SDK does not generate keys — it signs with a key you supply. Derive one with `@noble/secp256k1`, the same library and derivation the node and Hub API use:

```javascript
import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';

const privateKeyBytes = secp.utils.randomPrivateKey();
const privateKey = '0x' + bytesToHex(privateKeyBytes);

// Uncompressed public key minus its 0x04 prefix, keccak-256'd; address is the last 20 bytes
const publicKeyBytes = secp.getPublicKey(privateKeyBytes, false);
const address = '0x' + bytesToHex(keccak_256(publicKeyBytes.slice(1)).slice(12, 32));
```

Fund the new address from the [faucet](/clutch-hub-api/faucet) before submitting transactions.

:::danger Never reuse a key from this repo
Config files in `clutch-node` and `clutch-hub-api` ship real private keys so the local stack runs out of the box — including validator `author_secret_key` values and the faucet key. Those keys are public, so anyone can sign as those accounts. Generate your own for anything beyond a throwaway local chain, and **never** store a production key in browser `localStorage`.
:::

## Security

- Private keys are never sent to the server
- Signing uses `@noble/secp256k1` and Keccak-256
- Transaction encoding uses RLP matching the node
- See [Signing and Encoding](/reference/signing-and-encoding) for the full spec
