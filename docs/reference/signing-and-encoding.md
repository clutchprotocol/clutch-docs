---
sidebar_position: 3
---

# Signing and Encoding

Clutch transactions use RLP encoding and secp256k1 signatures. The SDK and node must produce identical bytes.

## Unsigned transaction

RLP list of three elements:

```
[from, nonce, data]
```

- `from` — sender address hex **without** `0x` prefix
- `nonce` — integer account nonce from the node
- `data` — RLP-encoded function call (see below)

Hash the unsigned RLP with Keccak-256. The result is a 32-byte digest stored as a **64-character lowercase hex string** (no `0x`).

## Signed transaction

RLP list of seven elements:

```
[from, nonce, r, s, v, hash, data]
```

- `r`, `s` — signature components without `0x` prefix
- `v` — recovery id + 27 (e.g. 27 or 28)
- `hash` — the 64-char hex string from the unsigned hash step
- `data` — same function call payload as unsigned tx

Submit as `0x` + hex of the full signed RLP via `sendRawTransaction`.

## Signature algorithm

Critical detail — the node verifies signatures over:

```
Keccak256( UTF-8 bytes of the 64-char hash hex string )
```

Not over the raw 32-byte hash bytes. The SDK `signHash()` method implements this to match Rust node verification.

Signing library: `@noble/secp256k1` with recoverable signatures.

## Function call encoding

Each function call is RLP-encoded as `[tag, arguments]`:

### RideRequest (tag 1)

```
[1, [[pickupLatBits, pickupLngBits], [dropoffLatBits, dropoffLngBits], fare, referrer]]
```

Coordinates are IEEE 754 float64 encoded as uint64 big-endian bits.

### RideOffer (tag 2)

```
[2, [rideRequestTxHash, fare, referrer]]
```

### RideAcceptance (tag 3)

```
[3, [rideOfferTxHash]]
```

### RidePay (tag 4)

```
[4, [rideAcceptanceTxHash, fare]]
```

### RideCancel (tag 5)

```
[5, [rideAcceptanceTxHash]]
```

### RideRequestCancel (tag 8)

```
[8, [rideRequestTxHash]]
```

### Transfer (tag 0)

```
[0, [toAddress, value]]
```

Used by the faucet server-side. Not exposed via Hub API for apps.

Transaction hashes in arguments must be normalized (strip `0x`, handle legacy JSON wrapping) via `normalizeTxHashForRlp()`.

## SDK workflow

```javascript
const unsigned = await sdk.createUnsignedRideRequest({ ... });
const { rawTransaction, txHash } = await sdk.signTransaction(unsigned, privateKey);
await sdk.submitTransaction(rawTransaction);
```

`signTransaction` returns:

| Field | Description |
|-------|-------------|
| `r`, `s`, `v` | Signature components |
| `rawTransaction` | Full signed RLP hex with `0x` prefix |
| `txHash` | Keccak-256 hash of unsigned RLP |

## Verification checklist for custom clients

If implementing signing outside the SDK:

1. Match RLP field order exactly
2. Strip `0x` from `from`, `r`, `s`, and hash fields in signed RLP
3. Sign Keccak256 of UTF-8 hash hex string, not raw bytes
4. Use correct function call tag for each transaction type
5. Encode float coordinates as uint64 bit patterns

## Related

- [Transaction Types](/clutch-node/transaction-types)
- [SDK API Reference](/clutch-hub-sdk-js/api-reference)
- [Security](/reference/security)
