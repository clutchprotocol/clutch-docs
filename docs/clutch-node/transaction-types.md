---
sidebar_position: 4
---

# Transaction Types

Clutch Node supports custom non-EVM transaction types encoded with RLP tags.

## Function call tags

| Tag | Type | Hub API / SDK | Description |
|-----|------|---------------|-------------|
| 0 | `Transfer` | No — not exposed | Standard CLT transfer |
| 1 | `RideRequest` | Yes | Passenger requests a ride |
| 2 | `RideOffer` | Yes | Driver offers to fulfill a request |
| 3 | `RideAcceptance` | Yes | Passenger accepts an offer |
| 4 | `RidePay` | Yes | Passenger pays driver (partial OK) |
| 5 | `RideCancel` | Yes | Cancel active trip, refund unpaid fare |
| 6 | `Mint` | No — node only | Credit CLT; only `mint_authority` may sign one |
| 7 | `Burn` | Yes (`createUnsignedBurn`) | Destroy CLT from the caller's own balance |
| 8 | `RideRequestCancel` | Yes | Cancel pending request |
| 9 | `ChainInit` | No — genesis only | Carries consensus parameters into state at block 0 |

Tags are **not contiguous** by design: 6 and 7 were reserved ahead of time for Mint/Burn, and 9 was left open for `ChainInit`, added later still. Apps interact with types 1–5, 7, and 8 via the Hub API and SDK. Type 0 is a valid node-level transaction but is not exposed by the Hub API or the SDK. Types 6 and 9 never appear in application code — see below.

## Ride lifecycle

```
RideRequest → RideOffer(s) → RideAcceptance → RidePay → completed
     ↓                              ↓
RideRequestCancel              RideCancel
```

## Mint (tag 6)

Credits CLT to an address. This is the chain's **only** on-ramp for new supply.

```
Mint { to: address, amount: u64, credit_ref: 64-hex-chars }
```

- Only the address recorded as `mint_authority` in genesis may sign a `Mint` — any other sender is rejected before it reaches the pool.
- `credit_ref` is the hash of an off-chain deposit intent (a specific USDT-on-Tron transfer, matched and verified by the treasury). The node records every `credit_ref` it has processed and rejects a repeat — so a retried or duplicated deposit request can never credit twice, no matter how many times the caller retries it.
- `Mint` is fee-exempt: the mint authority is not required to hold CLT of its own in order to credit users.

Not exposed via the Hub API or SDK — it is constructed and signed directly against the node by whoever holds the mint authority key, which in practice is `treasury-service` (see [Clutch Treasury](/clutch-treasury/overview)). See [CLT Economics](/clutch-node/clt-economics) for why this operation exists and what guarantees the chain does (and does not) provide around it.

## Burn (tag 7)

Destroys CLT from the caller's own balance. This is the chain's **only** other supply-changing operation, and the counterpart to Mint.

```
Burn { amount: u64, redemption_ref: optional 64-hex-chars }
```

- Permissionless — any account may burn its own balance; there is no authority check.
- `redemption_ref` is **optional**. When present, it's the hash of an off-chain redemption intent, letting an off-chain payout worker match a confirmed burn to the withdrawal it should trigger. A plain burn (no off-chain counterpart) omits it.
- Burn pays the flat `tx_fee` like most other transaction types — the burner has balance by definition, so exempting it would give spam a free pass through the one transaction type guaranteed to have funds.
- The exactly-once check on `redemption_ref` shares its marker with `Mint`'s `credit_ref` — one namespace, so a reference can't be reused across mint and burn either.

Exposed via the SDK/Hub API as `createUnsignedBurn` — see [SDK API Reference](/clutch-hub-sdk-js/api-reference) and [GraphQL Reference](/clutch-hub-api/graphql#createunsignedburn).

## ChainInit (tag 9) — genesis only

The single transaction in block 0. Carries every consensus parameter into state:

```
ChainInit {
  chain_id, is_testnet, tx_fee,
  ride_request_referrer_fee_bps, ride_offer_referrer_fee_bps,
  mint_authority, faucet_address, faucet_allocation
}
```

Its hash feeds the genesis block hash, and peers compare genesis hashes at the p2p handshake — a node configured with different values for any of these fields computes a different genesis and cannot peer with the rest of the network. `ChainInit` is rejected by validation at any height other than 0; it is never constructed by an app, the SDK, or the Hub API. See [Node Configuration](/clutch-node/configuration#consensus-parameters-must-match-across-every-node) and [CLT Economics](/clutch-node/clt-economics).

## Referrer fees

On `RidePay`, the node distributes referrer fees from each payment installment:

- `ride_request_referrer_fee_bps` (default 200 = 2%)
- `ride_offer_referrer_fee_bps` (default 200 = 2%)

Fees use **floor** rounding (`floor(fare × bps / 10_000)`) — replacing the old ceiling rounding, which could inflate a fee on a tiny fare to a wildly wrong percentage. The **driver** always receives the exact remainder, so referrer fees plus the driver's share sum to the fare precisely, for every input.

The passenger is debited the full fare **plus the flat `tx_fee`** at `RideAcceptance`; `RidePay` credits the driver and referrers (and separately pays its own `tx_fee` to the block author) without debiting the passenger again for the fare itself.

Referrer addresses for new requests and offers are injected server-side by the Hub API from `default_ride_request_referrer` and `default_ride_offer_referrer` config.

See [CLT Economics](/clutch-node/clt-economics) for the full payment flow, the peg, and examples.

## Validator compensation

There are no block rewards. Every non-exempt transaction (everything except `Mint` and `ChainInit`) pays a flat `tx_fee` (default 1000 CLT = $0.001) to the author of the block it lands in. See [CLT Economics](/clutch-node/clt-economics#validator-compensation-flat-transaction-fee) for why this replaced block rewards.

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
| `get_chain_info` | Genesis-committed chain parameters, `total_supply`, and `latest_block_index` |
| `list_ride_requests` | Open requests (optional map bounds) |
| `list_ride_offers` | Offers for a request hash |
| `list_active_trips` | In-progress trips |
| `list_completed_trips` | Fully paid trips |
| `list_recent_trips` | Completed + cancelled |

That is the complete list — any other method name returns a method-not-found error. Apps typically use the Hub API instead of calling the node directly. See [JSON-RPC Reference](/clutch-node/json-rpc) for full request/response shapes, including `get_chain_info`'s.

## Related

- [Signing and Encoding](/reference/signing-and-encoding) — exact RLP shapes for every tag
- [Ride Lifecycle](/getting-started/ride-lifecycle)
- [CLT Economics](/clutch-node/clt-economics)
- [GraphQL reference](/clutch-hub-api/graphql)
