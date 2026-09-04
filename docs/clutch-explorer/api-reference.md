---
sidebar_position: 3
---

# Explorer API Reference

Base URL: `http://localhost:8088` (or your deployed explorer backend).

## Health

| Route | Description |
|-------|-------------|
| `GET /health` | Liveness — `{ "status": "ok" }` |
| `GET /ready` | Readiness — `{ "status": "ready" }` |

## Blocks

### List blocks

```
GET /api/v1/blocks?limit=20&offset=0
```

Query params:

| Param | Default | Max |
|-------|---------|-----|
| `limit` | 20 | 100 |
| `offset` | 0 | — |

```json
{
  "items": [
    {
      "height": 118234,
      "hash": "0xabc123...",
      "tx_count": 3,
      "producer": "0x9b6e8af0c70...",
      "reward_recipient": "0x9b6e8af0c70...",
      "block_reward": 0,
      "timestamp": "2026-09-03T12:00:00Z"
    }
  ],
  "paging": { "limit": 20, "offset": 0, "total": 20, "has_more": true }
}
```

### Get block

```
GET /api/v1/blocks/:id
```

`:id` is block index or hash. Returns the block directly — not wrapped in `items`:

```json
{
  "height": 118234,
  "hash": "0xabc123...",
  "parent_hash": "0xabc122...",
  "tx_count": 3,
  "producer": "0x9b6e8af0c70...",
  "reward_recipient": "0x9b6e8af0c70...",
  "block_reward": 0,
  "timestamp": "2026-09-03T12:00:00Z",
  "total_fees": 0
}
```

`total_fees` is a placeholder — see [Fields that are placeholders today](#fields-that-are-placeholders-today).

## Transactions

### List transactions

```
GET /api/v1/transactions?limit=20&offset=0&address=0x...&status=...
```

| Param | Description |
|-------|-------------|
| `address` | Filter by sender or involved address — case-insensitive, matches either `from` or `to` |
| `status` | Exact match against the stored status. See the placeholder note below before relying on this: only one value is ever stored today. |

```json
{
  "items": [
    {
      "hash": "0xdef456...",
      "block_height": 118234,
      "from": "0x1111111111111111111111111111111111111111",
      "to": "0x2222222222222222222222222222222222222222",
      "amount": 5000000,
      "fee": 0,
      "status": "confirmed",
      "function_call_type": "RidePay",
      "is_ride_related": true,
      "timestamp": "2026-09-03T12:00:00Z",
      "referrer": null,
      "request_referrer_fee": 0,
      "offer_referrer_fee": 0
    }
  ],
  "paging": { "limit": 20, "offset": 0, "total": 20, "has_more": true }
}
```

`fee` and `status` are placeholders — see below.

### Get transaction

```
GET /api/v1/transactions/:hash
```

Returns the transaction directly — not wrapped in `items` — with a few fields the list view omits:

```json
{
  "hash": "0xdef456...",
  "block_height": 118234,
  "from": "0x1111111111111111111111111111111111111111",
  "to": "0x2222222222222222222222222222222222222222",
  "amount": 5000000,
  "fee": 0,
  "status": "confirmed",
  "function_call_type": "RidePay",
  "is_ride_related": true,
  "timestamp": "2026-09-03T12:00:00Z",
  "nonce": 7,
  "tx_index": 0,
  "referrer": null,
  "request_referrer": null,
  "offer_referrer": null,
  "request_referrer_fee": 0,
  "offer_referrer_fee": 0
}
```

## Accounts

### Get account

```
GET /api/v1/accounts/:address
```

Returns the account directly:

```json
{
  "address": "0x1111111111111111111111111111111111111111",
  "balance": 42000000,
  "nonce": 7,
  "tx_count": 12,
  "activity_count": 15,
  "is_contract": false
}
```

### Account activity

```
GET /api/v1/accounts/:address/activity?limit=20&offset=0
```

Balance effects and activity feed:

```json
{
  "items": [
    {
      "address": "0x1111111111111111111111111111111111111111",
      "kind": "ride_pay",
      "label": "Ride payment",
      "delta": -5000000,
      "direction": "debit",
      "amount": 5000000,
      "tx_hash": "0xdef456...",
      "block_height": 118234,
      "tx_index": 0,
      "function_call_type": "RidePay",
      "counterparty": "0x2222222222222222222222222222222222222222",
      "timestamp": "2026-09-03T12:00:00Z"
    }
  ],
  "paging": { "limit": 20, "offset": 0, "total": 20, "has_more": true }
}
```

## Validators

```
GET /api/v1/validators?limit=20&offset=0
```

Takes the same `limit`/`offset` as the list endpoints above (default 20, max 100):

```json
{
  "items": [
    {
      "address": "0x9b6e8af0c70...",
      "is_active": true,
      "blocks_produced": 3941,
      "peer_id": ""
    }
  ],
  "paging": { "limit": 20, "offset": 0, "total": 3, "has_more": false }
}
```

`peer_id` is a placeholder — see below.

## Search

```
GET /api/v1/search?q=<query>
```

Exact match only — not a substring or fuzzy search. A `0x`-prefixed query is checked for an exact match against transaction hash, then account address, then block hash, in that order; a plain integer is checked against block height; anything else returns no results. The response has no `paging` — search takes no `limit`/`offset`:

```json
{
  "items": [
    { "kind": "transaction", "identifier": "0xdef456...", "summary": "Transaction hash match" }
  ]
}
```

## Network stats

```
GET /api/v1/stats
```

Returns the object directly, like the detail endpoints above:

```json
{
  "latest_height": 118234,
  "tx_per_second": 0.0,
  "total_transactions": 48213,
  "active_validators": 3,
  "avg_block_time_seconds": 0.0
}
```

`tx_per_second` and `avg_block_time_seconds` are placeholders — see below.

## Fields that are placeholders today

A few fields in the shapes above never change no matter what happened on chain. That isn't a query bug — each one is a literal value written at the point of ingestion, because the data behind it isn't computed anywhere yet:

| Field | Where it appears | Always | Why |
|-------|-------------------|--------|-----|
| `fee` | Transaction list and detail | `0` | Hardcoded when the indexer builds a transaction row — the node's block payload has no per-transaction fee for it to read. |
| `status` | Transaction list and detail; the `status` filter on the list endpoint | `"confirmed"` | Hardcoded for the same reason. Every transaction the indexer sees already passed the node's validation before landing in a block, so there's no pending/failed state to report — but it also means the `status` query parameter can't currently narrow anything, since exactly one value is ever stored. |
| `total_fees` | Block detail | `0` | Hardcoded at ingestion, same cause as transaction `fee` — nothing populates the per-block sum yet. |
| `peer_id` | Validators | `""` | The indexer derives the validator set from block producer addresses; the node's block payload identifies a producer by address only, with no libp2p peer id attached. |
| `tx_per_second` | Network stats | `0.0` | Not computed. `get_stats` runs real `COUNT`/`MAX` queries for the other fields and returns a literal `0.0` for this one. |
| `avg_block_time_seconds` | Network stats | `0.0` | Same as `tx_per_second` — no computation exists yet. |

None of these are configurable from the API side; they'll start reflecting reality only once the indexer or the node is extended to compute them.

## Error responses

```json
{
  "code": "not_found",
  "message": "..."
}
```

Codes: `not_found`, `invalid_request`, `upstream_error`, `storage_error`.

## Pagination

List endpoints wrap results in an envelope:

```json
{
  "items": [ ],
  "paging": {
    "limit": 20,
    "offset": 0,
    "total": 20,
    "has_more": true
  }
}
```

**`total` is not a count of matching rows** — the backend never runs that query. It is simply `offset + items.len()`, the position just past the last item on this page. On every page but a short final one, that's the same as `offset + limit`; it looks like a running total but isn't one, since it has no idea how many rows exist beyond the page just returned. Don't use it to size a pager.

`has_more` is `true` whenever the page returned exactly `limit` items — it doesn't check that a next page actually has anything in it. If the real remaining count happens to equal `limit` exactly, `has_more` reports `true` for one extra request that then comes back empty. Treat it as "keep paging while this is true," not as a promise that more data exists.

Endpoints that don't use this envelope:

- **Detail endpoints** (`GET /api/v1/blocks/:id`, `GET /api/v1/transactions/:hash`, `GET /api/v1/accounts/:address`) and **`GET /api/v1/stats`** return the object directly — no `items`, no `paging`.
- **`GET /api/v1/search`** returns `{ "items": [...] }` with no `paging` — it takes no `limit`/`offset` to page through.

## Related

- [Explorer Overview](/clutch-explorer/overview)
- [Hub GraphQL](/clutch-hub-api/graphql) — for app development, not exploration
