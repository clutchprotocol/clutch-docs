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

const sdk = new ClutchHubSdk(API_URL, publicKey);
```

The constructor requires both the API URL and the wallet public key. The SDK automatically obtains a JWT via `generateToken` when you call authenticated methods.

## Basic transaction flow

Every on-chain action follows the same pattern:

1. **Create unsigned tx** — API builds payload and fetches nonce
2. **Sign client-side** — private key never leaves your app
3. **Submit** — send raw RLP hex to the network

```javascript
const unsigned = await sdk.createUnsignedRideRequest({
  pickup: { latitude: 35.7, longitude: 51.4 },
  dropoff: { latitude: 35.8, longitude: 51.5 },
  fare: 1000,
});

const signed = await sdk.signTransaction(unsigned, privateKey);
const result = await sdk.submitTransaction(signed.rawTransaction);

console.log('Submitted:', signed.txHash, result);
```

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
const balance = await sdk.getAccountBalance();
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

## Demo private key

The demo app uses a well-known test key for local development only. **Never use demo keys or store production keys in browser localStorage.**

```javascript
// LOCAL TESTNET ONLY — do not use in production
const privateKey = '0883ddd3d07303b87c954b0c9383f7b78f45e002520fc03a8adc80595dbf6509';
```

## Security

- Private keys are never sent to the server
- Signing uses `@noble/secp256k1` and Keccak-256
- Transaction encoding uses RLP matching the node
- See [Signing and Encoding](/reference/signing-and-encoding) for the full spec
