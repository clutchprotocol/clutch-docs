---
sidebar_position: 4
---

# Transaction Types

Clutch Node supports custom non-EVM transaction types encoded with RLP tags.

## Function call tags

| Tag | Type | Hub API / SDK | Description |
|-----|------|---------------|-------------|
| 0 | `Transfer` | Faucet only | Standard CLT transfer |
| 1 | `RideRequest` | Yes | Passenger requests a ride |
| 2 | `RideOffer` | Yes | Driver offers to fulfill a request |
| 3 | `RideAcceptance` | Yes | Passenger accepts an offer |
| 4 | `RidePay` | Yes | Passenger pays driver (partial OK) |
| 5 | `RideCancel` | Yes | Cancel active trip, refund unpaid fare |
| 6 | `ConfirmArrival` | No | Stub — no state changes yet |
| 7 | `ComplainArrival` | No | Stub — no state changes yet |
| 8 | `RideRequestCancel` | Yes | Cancel pending request |

Apps interact with types 1–5 and 8 via the Hub API and SDK. Type 0 is used internally by the faucet.

## Ride lifecycle

```
RideRequest → RideOffer(s) → RideAcceptance → RidePay → completed
     ↓                              ↓
RideRequestCancel              RideCancel
```

## Referrer fees

On `RidePay`, the node distributes referrer fees based on config:

- `ride_request_referrer_fee_percent` (default 2%)
- `ride_offer_referrer_fee_percent` (default 2%)

Referrer addresses for new requests and offers are injected server-side by the Hub API from `default_ride_request_referrer` and `default_ride_offer_referrer` config.

## JSON-RPC methods (node WebSocket)

The node exposes these methods at `ws://host:port/ws`:

| Method | Description |
|--------|-------------|
| `send_raw_transaction` | Submit signed RLP hex |
| `send_transaction` | Submit structured tx object |
| `get_next_nonce` | Account nonce |
| `get_account_balance` | CLT balance |
| `get_account_balance_effects` | Balance change history |
| `get_block_by_index` | Block lookup |
| `list_ride_requests` | Open requests (optional map bounds) |
| `list_ride_offers` | Offers for a request hash |
| `list_active_trips` | In-progress trips |
| `list_completed_trips` | Fully paid trips |
| `list_recent_trips` | Completed + cancelled |
| `import_block` | Validator / dev ops |
| `author_new_block` | Validator block production |

Apps typically use the Hub API instead of calling the node directly.

## Future types

`ConfirmArrival` and `ComplainArrival` exist in the node codebase as stubs. They are not exposed through the Hub API or SDK yet.

## Related

- [Signing and Encoding](/reference/signing-and-encoding)
- [Ride Lifecycle](/getting-started/ride-lifecycle)
- [GraphQL reference](/clutch-hub-api/graphql)
