---
sidebar_position: 1
---

# Clutch Hub SDK (JS) Overview

JavaScript/TypeScript SDK for client-side transaction signing and Clutch Hub API integration.

## Features

- **Client-side signing** — Private keys never leave the browser
- **Full ride lifecycle** — Request, offer, accept, pay, cancel
- **GraphQL integration** — Queries, mutations, and WebSocket subscriptions
- **Faucet helper** — `requestFaucet()` for testnet CLT
- **TypeScript** — Type-safe interfaces for all methods

## Install

```bash
npm install clutch-hub-sdk-js
```

## Quick example

```javascript
import { ClutchHubSdk } from 'clutch-hub-sdk-js';

const sdk = new ClutchHubSdk('http://localhost:3000', publicKey);

await sdk.requestFaucet(publicKey);

const tx = await sdk.createUnsignedRideRequest({
  pickup: { latitude: 35.7, longitude: 51.4 },
  dropoff: { latitude: 35.8, longitude: 51.5 },
  fare: 1000,
});

const signed = await sdk.signTransaction(tx, privateKey);
await sdk.submitTransaction(signed.rawTransaction);
```

## Documentation

- [Installation](/clutch-hub-sdk-js/installation)
- [Usage](/clutch-hub-sdk-js/usage)
- [API Reference](/clutch-hub-sdk-js/api-reference)
- [Subscriptions](/clutch-hub-sdk-js/subscriptions)

## Source

[clutch-hub-sdk-js](https://github.com/clutchprotocol/clutch-hub-sdk-js) on GitHub · [npm](https://www.npmjs.com/package/clutch-hub-sdk-js)
