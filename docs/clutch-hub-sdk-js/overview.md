---
sidebar_position: 1
---

# Clutch Hub SDK (JS) Overview

JavaScript/TypeScript SDK for client-side transaction signing and Clutch Hub API integration.

## Features

- **Client-side signing** — Private keys never leave the browser
- **Full ride lifecycle** — Request, offer, accept, pay, cancel; plus **Burn** for CLT redemption
- **Chain-bound and verifiable** — `chain_id` in every signature; `verifyUnsignedTransaction` checks a hub-returned transaction before you sign it
- **GraphQL integration** — Queries, mutations, and WebSocket subscriptions
- **Faucet helper** — `requestFaucet()` for testnet CLT
- **TypeScript** — Type-safe interfaces for all methods; amounts are `bigint`

:::warning v3: breaking changes
Amounts are now `bigint` (not `number`), the constructor takes an optional `chainId`, and the signed wire format gained a field. See [v3 breaking changes](/clutch-hub-sdk-js/api-reference#v3-breaking-changes) before upgrading from v2.
:::

## Install

```bash
npm install clutch-hub-sdk-js
```

## Quick example

```javascript
import { ClutchHubSdk } from 'clutch-hub-sdk-js';

const CHAIN_ID = 2077; // from your app config — never from the hub

const sdk = new ClutchHubSdk('http://localhost:3000', publicKey, undefined, CHAIN_ID);

await sdk.requestFaucet(publicKey);

const tx = await sdk.createUnsignedRideRequest({
  pickup: { latitude: 35.7, longitude: 51.4 },
  dropoff: { latitude: 35.8, longitude: 51.5 },
  fare: 5_000_000n, // $5.00 at 1 USD = 1,000,000 CLT
});

const signed = await sdk.signTransaction(tx, privateKey, { type: 'RideRequest', fare: 5_000_000n });
await sdk.submitTransaction(signed.rawTransaction);
```

## Documentation

- [Installation](/clutch-hub-sdk-js/installation)
- [Usage](/clutch-hub-sdk-js/usage)
- [API Reference](/clutch-hub-sdk-js/api-reference)
- [Subscriptions](/clutch-hub-sdk-js/subscriptions)

## Source

[clutch-hub-sdk-js](https://github.com/clutchprotocol/clutch-hub-sdk-js) on GitHub · [npm](https://www.npmjs.com/package/clutch-hub-sdk-js)
