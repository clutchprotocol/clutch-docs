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

### Get block

```
GET /api/v1/blocks/:id
```

`:id` is block index or hash.

## Transactions

### List transactions

```
GET /api/v1/transactions?limit=20&offset=0&address=0x...&status=...
```

| Param | Description |
|-------|-------------|
| `address` | Filter by sender or involved address |
| `status` | Filter by transaction status |

### Get transaction

```
GET /api/v1/transactions/:hash
```

## Accounts

### Get account

```
GET /api/v1/accounts/:address
```

Returns balance, nonce, transaction count.

### Account activity

```
GET /api/v1/accounts/:address/activity?limit=20&offset=0
```

Balance effects and activity feed.

## Validators

```
GET /api/v1/validators
```

Current validator set.

## Search

```
GET /api/v1/search?q=<query>
```

Search blocks, transactions, and addresses.

## Network stats

```
GET /api/v1/stats
```

Network-wide statistics.

## Error responses

```json
{
  "code": "not_found",
  "message": "..."
}
```

Codes: `not_found`, `invalid_request`, `upstream_error`, `storage_error`.

## Pagination

List endpoints return:

```json
{
  "paging": {
    "limit": 20,
    "offset": 0,
    "total": 20,
    "has_more": true
  },
  "items": [ ]
}
```

## Related

- [Explorer Overview](/clutch-explorer/overview)
- [Hub GraphQL](/clutch-hub-api/graphql) — for app development, not exploration
