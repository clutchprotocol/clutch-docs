---
sidebar_position: 4
---

# SDK API Reference

## ClutchHubSdk

### Constructor

```typescript
new ClutchHubSdk(apiUrl: string, publicKey: string)
```

### Methods

| Method | Description |
|--------|-------------|
| `getPublicKey()` | Returns the public key for this instance |
| `isAuthenticated()` | Returns true if token is valid and not expired |
| `createUnsignedRideRequest(args)` | Fetches unsigned ride request from API |
| `signTransaction(tx, privateKey)` | Signs transaction client-side |
| `submitSignedTransaction(signedTx)` | Submits signed transaction to the API |

### Types

```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface RideRequestArgs {
  pickup: Coordinates;
  dropoff: Coordinates;
  fare: number;
}

interface SignedTx {
  from: string;
  nonce: number;
  payload: Uint8Array;
  r: string;
  s: string;
  v: number;
}
```

## Security

- Private keys are **never** sent to the server
- Signing uses `@noble/secp256k1`
- Hashing uses Keccak-256
- Transaction encoding uses RLP
