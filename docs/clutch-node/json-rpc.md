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
  "params": ["0x..."]
}
```

Responses return `result` on success or `error` with `code` and `message`.

## Write methods

### `send_raw_transaction`

Submit a signed, RLP-encoded transaction as hex.

```json
{
  "method": "send_raw_transaction",
  "params": ["0xe60188..."]
}
```

**Result:** transaction hash (hex) and inclusion info on success. The node verifies the secp256k1 signature, nonce, and that the sender has sufficient balance for `RideAcceptance` debits.

### `send_transaction`

Submit a structured transaction object (validator / dev tooling). Prefer `send_raw_transaction` from apps.

### `import_block`

Import a block (validator / dev ops). Not used by apps.

### `author_new_block`

Author a new block. Called by the Aura scheduler on the current validator; not intended for app use.

## Read methods

### `get_next_nonce`

```json
{ "method": "get_next_nonce", "params": ["0x<account>"] }
```

**Result:** integer nonce for the account. Use this before building a transaction so the signed payload carries the correct nonce.

### `get_account_balance`

```json
{ "method": "get_account_balance", "params": ["0x<account>"] }
```

**Result:** integer CLT balance.

### `get_account_balance_effects`

Returns the ordered history of balance changes (credits/debits) for an account. Useful for explorers reconstructing activity.

### `get_block_by_index`

```json
{ "method": "get_block_by_index", "params": [12] }
```

**Result:** block at the given height, including transactions.

## List methods

### `list_ride_requests`

Open ride requests (not yet accepted). Accepts optional map bounds:

```json
{
  "method": "list_ride_requests",
  "params": [{ "minLat": 35.6, "maxLat": 35.9, "minLng": 51.3, "maxLng": 51.6 }]
}
```

### `list_ride_offers`

```json
{
  "method": "list_ride_offers",
  "params": ["0x<rideRequestTxHash>"]
}
```

Driver offers for a specific ride request.

### `list_active_trips`

Trips accepted but not fully paid or cancelled. Optional `driverAddress` / `passengerAddress` filters.

### `list_completed_trips`

Trips where the full fare has been paid.

### `list_recent_trips`

Finished trips: completed (full fare paid) or cancelled. Includes `tripStatus`.

## Error handling

| Cause | Typical behavior |
|-------|------------------|
| Invalid signature | Tx rejected before mempool |
| Stale nonce | Rejected; fetch fresh nonce via `get_next_nonce` |
| Insufficient balance for `RideAcceptance` debit | Rejected at apply time |
| Unknown method | JSON-RPC `error` with method-not-found code |
| Malformed params | JSON-RPC `error` with invalid-params code |

Apps integrating directly should retry with backoff on transient WebSocket disconnects and re-fetch the nonce after any rejected send.

## Related

- [Transaction Types](/clutch-node/transaction-types)
- [GraphQL Reference](/clutch-hub-api/graphql) — preferred app interface
- [Transaction Flow](/reference/transaction-flow)
- [Signing and Encoding](/reference/signing-and-encoding)
