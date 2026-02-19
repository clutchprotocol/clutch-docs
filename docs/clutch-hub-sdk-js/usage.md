---
sidebar_position: 3
---

# SDK Usage

## Basic Flow

1. **Create SDK instance** — API URL + user's public key
2. **Get unsigned transaction** — `createUnsignedRideRequest(args)`
3. **Sign client-side** — `signTransaction(tx, privateKey)`
4. **Submit** — `submitSignedTransaction(signedTx)`

## Example

```javascript
import { ClutchHubSdk } from 'clutch-hub-sdk-js';

const API_URL = 'http://localhost:3000';
const publicKey = '0x9b6e8afff8329743cac73dbef83ca3cbf9a74c20';
const privateKey = '0883ddd3d07303b87c954b0c9383f7b78f45e002520fc03a8adc80595dbf6509';

const sdk = new ClutchHubSdk(API_URL, publicKey);

async function requestRide() {
  const tx = await sdk.createUnsignedRideRequest({
    pickup: { latitude: 35.7, longitude: 51.4 },
    dropoff: { latitude: 35.8, longitude: 51.5 },
    fare: 1000
  });

  const signed = await sdk.signTransaction(tx, privateKey);
  const receipt = await sdk.submitSignedTransaction(signed);

  console.log('Tx hash:', receipt.txHash);
}
```

## Coordinates

Both formats work:

```javascript
{ latitude: 35.7, longitude: 51.4 }
{ lat: 35.7, lng: 51.4 }
```

## Security

Never expose private keys. Use hardware wallets or secure keystores in production.
