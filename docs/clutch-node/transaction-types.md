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
| 8 | `RideRequestCancel` | Yes | Cancel pending request |

RLP tags 6 and 7 are reserved and not accepted by current nodes.

Apps interact with types 1–5 and 8 via the Hub API and SDK. Type 0 is used internally by the faucet.

## Ride lifecycle

```
RideRequest → RideOffer(s) → RideAcceptance → RidePay → completed
     ↓                              ↓
RideRequestCancel              RideCancel
```

## Referrer fees

On `RidePay`, the node distributes referrer fees from each payment installment:

- `ride_request_referrer_fee_percent` (default 2%)
- `ride_offer_referrer_fee_percent` (default 2%)

Fees use ceiling rounding. The **driver** receives the installment minus total referrer fees. The passenger is debited the full fare at `RideAcceptance`; `RidePay` credits the driver and referrers without debiting the passenger again.

Referrer addresses for new requests and offers are injected server-side by the Hub API from `default_ride_request_referrer` and `default_ride_offer_referrer` config.

Validators earn a fixed **block reward** (`block_reward_amount`, default 50 CLT per block), separate from ride payments.

See [CLT Economics](/clutch-node/clt-economics) for the full payment flow and examples.

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

That is the complete list — any other method name returns a method-not-found error. Apps typically use the Hub API instead of calling the node directly.

## Related

- [Signing and Encoding](/reference/signing-and-encoding)
- [Ride Lifecycle](/getting-started/ride-lifecycle)
- [GraphQL reference](/clutch-hub-api/graphql)
