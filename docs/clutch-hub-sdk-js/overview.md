---
sidebar_position: 1
---

# Clutch Hub SDK (JS) Overview

JavaScript/TypeScript SDK for transaction signing, encoding, and blockchain interaction with Clutch Protocol.

## Features

- **Client-side signing** — Private keys never leave the browser
- **Transaction helpers** — Build, encode, sign ride requests
- **API integration** — Fetch chain state, submit signed transactions
- **TypeScript** — Type-safe interfaces

## Install

```bash
npm install clutch-hub-sdk-js
```

## Quick Example

```javascript
import { ClutchHubSdk } from 'clutch-hub-sdk-js';

const sdk = new ClutchHubSdk('http://localhost:3000', userPublicKey);

// 1. Get unsigned transaction
const tx = await sdk.createUnsignedRideRequest({
  pickup: { latitude: 35.7, longitude: 51.4 },
  dropoff: { latitude: 35.8, longitude: 51.5 },
  fare: 1000
});

// 2. Sign (client-side)
const signed = await sdk.signTransaction(tx, userPrivateKey);

// 3. Submit
const receipt = await sdk.submitSignedTransaction(signed);
```

## Source

[clutch-hub-sdk-js](https://github.com/clutchprotocol/clutch-hub-sdk-js) on GitHub.
