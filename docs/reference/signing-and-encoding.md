---
sidebar_position: 3
---

# Signing and Encoding

Clutch transactions use RLP encoding and secp256k1 signatures. The SDK and node must produce identical bytes.

## Unsigned transaction

RLP list of **four** elements:

```
[from, nonce, chain_id, data]
```

- `from` — sender address hex **without** `0x` prefix
- `nonce` — integer account nonce from the node
- `chain_id` — the network's chain ID (see below)
- `data` — RLP-encoded function call (see below)

Hash the unsigned RLP with Keccak-256. The result is a 32-byte digest stored as a **64-character lowercase hex string** (no `0x`).

:::info Why chain_id is in the preimage
A signature previously committed to a transaction's contents but not the network it was meant for. Concretely: a `Mint` signed by the mint authority on testnet would recover to the same valid signature if replayed against a mainnet node, because nothing in the signed bytes said which chain it was for. Putting `chain_id` in the hash preimage means the same transaction on two different chains hashes — and therefore signs — differently. The node rejects a transaction whose `chain_id` field doesn't match its own (from `get_chain_info`), so a cross-chain replay fails at validation, not by luck.
:::

## Signed transaction

RLP list of **eight** elements:

```
[from, nonce, chain_id, r, s, v, hash, data]
```

- `chain_id` — same value as the unsigned preimage, **at index 2**
- `r`, `s` — signature components without `0x` prefix
- `v` — recovery id + 27 (e.g. 27 or 28)
- `hash` — the 64-char hex string from the unsigned hash step
- `data` — same function call payload as unsigned tx

Submit as `0x` + hex of the full signed RLP via `sendRawTransaction`.

### chain_id encoding

`chain_id` is RLP-encoded as an unsigned integer using **minimal big-endian** representation — the standard RLP integer encoding, which strips leading zero bytes (a `chain_id` of `2077` encodes as the two bytes `0x08 0x1d`, not zero-padded to any fixed width). This is the same encoding RLP libraries already use for `nonce` and other integers; there is no special-case handling needed, but implementers writing a custom encoder should not assume a fixed byte width for this field.

## Signature algorithm

Critical detail — the node verifies signatures over:

```
Keccak256( UTF-8 bytes of the 64-char hash hex string )
```

Not over the raw 32-byte hash bytes. The SDK `signHash()` method implements this to match Rust node verification.

Signing library: `@noble/secp256k1` with recoverable signatures.

## Function call encoding

Each function call is RLP-encoded as `[tag, arguments]`.

### RLP tag table

Tags are **deliberately non-contiguous** — 6 and 7 were reserved for Mint/Burn ahead of time, and 9 was left for a genesis-only type added later:

| Tag | Type | Notes |
|-----|------|-------|
| 0 | `Transfer` | Faucet only; not exposed via Hub API for apps |
| 1 | `RideRequest` | |
| 2 | `RideOffer` | |
| 3 | `RideAcceptance` | |
| 4 | `RidePay` | |
| 5 | `RideCancel` | |
| **6** | **`Mint`** | Mint-authority only |
| **7** | **`Burn`** | Permissionless |
| 8 | `RideRequestCancel` | |
| **9** | **`ChainInit`** | Genesis-only — never constructed by apps or the SDK |

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

### Mint (tag 6)

```
[6, [to, amount, credit_ref]]
```

- `to` — recipient address
- `amount` — CLT (micro-USD) to credit, as an integer
- `credit_ref` — **64 lowercase hex characters**, no `0x`: the hash of the off-chain deposit intent this mint fulfills

Only the address recorded as `mint_authority` in genesis may sign a `Mint`; any other sender is rejected. The node also rejects a `credit_ref` it has already seen — a retried or duplicated deposit-intent can never credit twice, because the ref is written to state as a one-time marker keyed off `processed_ref_{credit_ref}`.

### Burn (tag 7)

```
[7, [amount, redemption_ref]]
```

- `amount` — CLT to destroy from the sender's own balance
- `redemption_ref` — **optional**: 64 lowercase hex characters if present, or an empty string if absent (the same "empty string means unset" convention the RLP layer already uses for `referrer`)

Anyone may burn their own balance — there is no authority check. `redemption_ref`, when supplied, is the hash of an off-chain redemption intent; an off-chain payout worker uses it to match a confirmed burn to the withdrawal request it corresponds to. It uses the **same exactly-once marker** as `credit_ref` (one shared ref namespace), so a redemption ref can't be reused either. The ref is optional because burning does not require an off-chain counterpart — the chain-side destruction is final and irreversible on its own; the payout matching is an off-chain convenience on top of it.

Burn's ordering relative to the off-chain payout is deliberate: the transaction destroys the CLT first, and the off-chain payout happens second, because the on-chain leg is final while a stuck or failed off-chain transfer can always be retried or manually completed against the recorded ref.

### RideRequestCancel (tag 8)

```
[8, [rideRequestTxHash]]
```

### Transfer (tag 0)

```
[0, [toAddress, value]]
```

Used by the faucet server-side. Not exposed via Hub API for apps.

### ChainInit (tag 9) — genesis only

```
[9, [chain_id, is_testnet, tx_fee, ride_request_referrer_fee_bps, ride_offer_referrer_fee_bps, mint_authority, faucet_address, faucet_allocation]]
```

`ChainInit` is the single transaction in block 0. It carries every consensus parameter into state at genesis, and its hash feeds the genesis block hash. Peers compare genesis hashes during the p2p handshake, so a node configured with different values for any of these fields computes a different genesis hash and **cannot peer** with the rest of the network — it is refused outright, not silently forked. Apps and the SDK never construct a `ChainInit`; it exists only in the genesis block a node builds from its own config at first boot. See [CLT Economics](/clutch-node/clt-economics) and [Node Configuration](/clutch-node/configuration) for what each field means.

---

Transaction hashes in arguments must be normalized (strip `0x`, handle legacy JSON wrapping) via `normalizeTxHashForRlp()`.

## SDK workflow

```javascript
const unsigned = await sdk.createUnsignedRideRequest({ ... });
const { rawTransaction, txHash } = await sdk.signTransaction(unsigned, privateKey);
await sdk.submitTransaction(rawTransaction);
```

`signTransaction` returns:

| Field | Description |
|-------|--------------|
| `r`, `s`, `v` | Signature components |
| `rawTransaction` | Full signed RLP hex with `0x` prefix |
| `txHash` | Keccak-256 hash of unsigned RLP |

The SDK reads `chain_id` from its own configuration — pinned by the app, not read back from the Hub API — and threads it into both the hash preimage and the wire format automatically. See [SDK API Reference](/clutch-hub-sdk-js/api-reference#chain_id-and-verifyunsignedtransaction) for why the SDK insists on a locally-pinned `chain_id` rather than trusting the value in a hub-returned unsigned transaction.

## Verification checklist for custom clients

If implementing signing outside the SDK:

1. Match RLP field order exactly, including `chain_id` at index 2 in both the 4-item preimage and the 8-item signed format
2. Strip `0x` from `from`, `r`, `s`, and hash fields in signed RLP
3. Sign Keccak256 of UTF-8 hash hex string, not raw bytes
4. Use the correct function call tag for each transaction type — see the [tag table](#rlp-tag-table) above; remember tags are non-contiguous
5. Encode float coordinates as uint64 bit patterns
6. Encode `chain_id` as a minimal big-endian integer (standard RLP integer encoding — no special casing)
7. Pin `chain_id` to the network you intend to submit to; do not trust a `chain_id` value from an untrusted source when building a transaction meant for signing

## Related

- [Transaction Types](/clutch-node/transaction-types)
- [SDK API Reference](/clutch-hub-sdk-js/api-reference)
- [Security](/reference/security)
