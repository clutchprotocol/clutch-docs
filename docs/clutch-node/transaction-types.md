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
| 5 | `RideCancel` | Yes | Cancel active trip; refunds the unpaid fare to the passenger, or releases it to the driver past the auto-release window (see [Ride Lifecycle](/getting-started/ride-lifecycle#who-the-unpaid-remainder-goes-to) — 5 minutes on the public testnet, 2 hours on mainnet) |
| 6 | `Mint` | No — node only | Credit CLT; only `mint_authority` may sign one |
| 7 | `Burn` | Yes (`createUnsignedBurn`) | Destroy CLT from the caller's own balance |
| 8 | `RideRequestCancel` | Yes | Cancel pending request |
| 9 | `ChainInit` | No — genesis only | Carries consensus parameters into state at block 0 |
| 10 | `WalletTransfer` | No — sent from MetaMask through `/rpc` | A transfer signed by an Ethereum wallet |

Tags are **not contiguous** by design: 6 and 7 were reserved ahead of time for Mint/Burn, and 9 was left open for `ChainInit`, added later still. Apps interact with types 1–5, 7, and 8 via the Hub API and SDK. Type 0 is a valid node-level transaction but is not exposed by the Hub API or the SDK. Types 6 and 9 never appear in application code, and type 10 is built by the node from a wallet's signed transaction — see below.

## Ride lifecycle

```
RideRequest → RideOffer(s) → RideAcceptance → RidePay → completed
     ↓                              ↓
RideRequestCancel              RideCancel
```

## Mint (tag 6)

Credits CLT to an address. This is the chain's **only** on-ramp for new supply.

```
Mint { to: address, amount: u64, credit_ref: 64-hex-chars, cosignatures: [{ r, s, v }] }
```

- Only a member of the mint authority set may sign a `Mint` — `mint_authority`, plus any `mint_cosigners` committed in genesis. Any other sender is rejected before it reaches the pool.
- On a chain with `mint_threshold` above 1, a `Mint` also carries approval signatures from distinct other members of that set, so one stolen key mints nothing on its own. Each approver signs `Keccak256(RLP([chain_id, to, amount, credit_ref]))`, not the transaction hash, so an approval for one mint cannot authorise another. The cosignatures sit inside the transaction's data, so the submitter's own signature covers them and nobody can add, remove or swap one afterwards. On a single-signer chain `cosignatures` is empty and is left out of the encoding. Both live chains are single-signer today: see [Mainnet Readiness](/reference/mainnet-readiness#key-custody).
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
  mint_authority, faucet_address, faucet_allocation,
  ride_auto_release_secs,
  mint_cosigners, mint_threshold   // only on a multi-signature chain
}
```

Its hash feeds the genesis block hash, and peers compare genesis hashes at the p2p handshake — a node configured with different values for any of these fields computes a different genesis and cannot peer with the rest of the network. `ChainInit` is rejected by validation at any height other than 0; it is never constructed by an app, the SDK, or the Hub API. See [Node Configuration](/clutch-node/configuration#consensus-parameters-must-match-across-every-node) and [CLT Economics](/clutch-node/clt-economics).

## WalletTransfer (tag 10)

A CLT transfer sent from MetaMask, Trust Wallet or another Ethereum wallet. A wallet can only send a coin by signing an ordinary Ethereum transaction, so the node accepts that signed transaction as it is (through [`send_wallet_transaction`](/clutch-node/json-rpc#send_wallet_transaction), which the Hub API's `/rpc` endpoint calls for `eth_sendRawTransaction`) and keeps every field the signature covers:

```
WalletTransfer { to, value, gas_price, gas_limit, wallet_chain_id }
```

- `from` is recovered from the signature, and the Clutch nonce is the wallet's nonce plus one (Ethereum counts from 0).
- `value` is in CLT base units. A wallet counts in 18 decimals, so it signs `value × 10^12`. An amount with more than 6 decimals cannot be represented and is refused, never rounded.
- The fee is the flat `tx_fee`, as for every transfer. `gas_price × gas_limit` must cover it in wei; the Hub API's `eth_gasPrice` answers the smallest whole-gwei price that does (48 gwei for a fee of $0.001).
- `wallet_chain_id` is the EIP-155 chain id the wallet signed for (20771 on the testnet, 20770 on mainnet) and must equal the node's own, so a signature made for another network, Ethereum included, does not move CLT here.
- The transaction hash is the Ethereum transaction hash. Only the wallet's own EIP-155 signature verifies it.
- Refused: data (there are no contracts), contract creation, typed (EIP-1559) transactions, transactions without a chain id, and malleable high-`s` signatures.

Rides and payments still go through the app; a wallet only sends plain transfers.

**Where it works today:** the testnet only. Mainnet's validators have not switched it on, so a send from MetaMask on mainnet is refused with a message to send from the Clutch app. Mainnet balances still show in the wallet.

**A consensus rule switched on per chain.** Two node settings turn it on: `wallet_chain_id` and `wallet_transfers_from_block` (set both or neither). Without them, or below that block, a `WalletTransfer` is refused in the pool and in blocks, so every validator must carry the same two values before that block is reached. See [Node Configuration](/clutch-node/configuration).

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
| `send_wallet_transaction` | Submit a wallet's signed Ethereum transfer |
| `get_transaction_by_hash` | A transaction and the block it is in |
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
