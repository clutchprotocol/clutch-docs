---
sidebar_position: 2
---

# SDK Usage

## Basic Flow

1. Encode ride/transaction data
2. Hash with SHA256 (client-side)
3. Sign hash with private key (secp256k1)
4. Submit signed transaction via API

## Example (conceptual)

```typescript
import { ClutchHubSdk } from '@clutchprotocol/clutch-hub-sdk';

const sdk = new ClutchHubSdk({
  apiUrl: 'http://localhost:3000',
  publicKey: '...',
});

// Build, sign, submit
const tx = await sdk.buildTransaction({ /* ride data */ });
const signed = await sdk.sign(tx, privateKey);
await sdk.submit(signed);
```

See the [SDK repository](https://github.com/clutchprotocol/clutch-hub-sdk-js) for full API and examples.
