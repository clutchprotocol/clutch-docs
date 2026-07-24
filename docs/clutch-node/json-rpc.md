---
sidebar_position: 6
---

# JSON-RPC Reference

The node exposes a WebSocket JSON-RPC API at `ws://host:port/ws`. Apps usually go through the [Hub API](/clutch-hub-api/overview) instead of calling these methods directly, but they are documented here for node operators, explorers, and tooling.

All requests follow JSON-RPC 2.0:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "get_account_balance",
  "params": { "address": "0x..." }
}
```

Responses return `result` on success or `error` with `code` and `message`.

`params` is a bare JSON **object**, not a positional array — the only exception is `send_raw_transaction`, which takes a bare hex **string**. Array-wrapped params fail with invalid-params on methods that require fields, but the `list_*` methods silently ignore them and return unfiltered results instead of erroring.

## Write methods

### `send_raw_transaction`

Submit a signed, RLP-encoded transaction as hex.

```json
{
  "method": "send_raw_transaction",
  "params": "0xe60188..."
}
```

**Result:** the literal string `"Transaction imported"` — the node returns no hash or inclusion info; compute the transaction hash client-side. The node verifies the secp256k1 signature, nonce, and that the sender has sufficient balance for `RideAcceptance` debits before pooling the transaction.

### `send_transaction`

Submit a structured transaction object as `params` (validator / dev tooling). Prefer `send_raw_transaction` from apps. Also returns `"Transaction imported"`.

## Read methods

### `get_next_nonce`

```json
{ "method": "get_next_nonce", "params": { "address": "0x<account>" } }
```

**Result:** `{ "nonce": n }` — the next nonce to use. Fetch this before building a transaction so the signed payload carries the correct nonce.

### `get_account_balance`

```json
{ "method": "get_account_balance", "params": { "address": "0x<account>" } }
```

**Result:** `{ "balance": n }` — integer CLT balance.

### `get_account_balance_effects`

Returns the ordered history of balance changes (credits/debits) for an account. Useful for explorers reconstructing activity.

### `get_block_by_index`

```json
{ "method": "get_block_by_index", "params": { "index": 12 } }
```

**Result:** block at the given height, including transactions.

## List methods

### `list_ride_requests`

Open ride requests (not yet accepted). Accepts optional map bounds as a bare object — the bounds keys are camelCase:

```json
{
  "method": "list_ride_requests",
  "params": { "minLat": 35.6, "maxLat": 35.9, "minLng": 51.3, "maxLng": 51.6 }
}
```

Wrapping the bounds in an array drops the filter silently and returns every open request — no error. Omit `params` (or send `{}`) when you want no filter.

### `list_ride_offers`

```json
{
  "method": "list_ride_offers",
  "params": { "ride_request_tx_hash": "0x<rideRequestTxHash>" }
}
```

Driver offers for a specific ride request. With no `params`, all open offers are returned.

### `list_active_trips`

Trips accepted but not fully paid or cancelled. Optional `driver_address` / `passenger_address` filters:

```json
{
  "method": "list_active_trips",
  "params": { "driver_address": "0x<driver>" }
}
```

Filter keys are snake_case only — `driverAddress` / `passengerAddress` are silently ignored and you get unfiltered results.

### `list_completed_trips`

Trips where the full fare has been paid. Same optional `driver_address` / `passenger_address` filters.

### `list_recent_trips`

Finished trips: completed (full fare paid) or cancelled. Includes `trip_status`. Same optional `driver_address` / `passenger_address` filters.

## Error handling

| Cause | Typical behavior |
|-------|------------------|
| Invalid signature | Tx rejected before mempool |
| Stale nonce | Rejected; fetch fresh nonce via `get_next_nonce` |
| Insufficient balance for `RideAcceptance` debit | Rejected during mempool admission, before pooling |
| Unknown method | JSON-RPC `error` with method-not-found code |
| Malformed params | JSON-RPC `error` with invalid-params code |

Apps integrating directly should retry with backoff on transient WebSocket disconnects and re-fetch the nonce after any rejected send.

## Related

- [Transaction Types](/clutch-node/transaction-types)
- [GraphQL Reference](/clutch-hub-api/graphql) — preferred app interface
- [Transaction Flow](/reference/transaction-flow)
- [Signing and Encoding](/reference/signing-and-encoding)
