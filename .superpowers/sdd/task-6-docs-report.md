# Task 6 — clutch-docs treasury-break update report

Branch: `treasury-break`. Not pushed, `main` untouched, per instructions.

## Ground truth sourcing

Read the exact shipped implementation rather than guessing:

- `clutch-node`: `docs/superpowers/plans/2026-07-27-treasury-node-break.md` (the full 9-task implementation plan, read in two passes) plus a research agent that quoted exact `.rs` source (file:line) for every claim — RLP tags, Mint/Burn/ChainInit structs, fee/referrer arithmetic, `get_chain_info` shape, faucet gating location, block-hash algorithm (SHA-256, not Keccak256 — kept that distinction correct throughout).
- `clutch-hub-api`: a research agent quoting exact `.rs` source. Found and corrected two assumptions from the task brief: there is **no `createUnsignedMint` mutation** (Mint is node-only, signed directly by whoever holds the mint authority key), and Hub API's `chainInfo` query does **not** include `latest_block_index` (only the node's raw `get_chain_info` RPC does) — documented both surfaces accurately rather than assuming parity.
- `clutch-hub-sdk-js`: a research agent quoting exact `.ts` source (this repo's own `CLAUDE.md`/`README.md`/`CHANGELOG.md` are stale v2-era docs — not used as sources). Found and corrected: the SDK implements only 7 of the 10 RLP tags (RideRequest, RideOffer, RideAcceptance, RidePay, RideCancel, Burn, RideRequestCancel) — no Transfer, Mint, or ChainInit builder exists client-side, and I did not document any.

## Files changed (21 total: the 17 named in the brief + 4 more found stale)

### Highest priority

**`docs/reference/signing-and-encoding.md`** — full rewrite.
- Unsigned preimage: 3→4 items, `chain_id` added at index 2; signed wire format: 7→8 items, `chain_id` at index 2. Explained why (replay-across-chains was a real gap: a testnet `Mint` could previously recover to a valid signature on mainnet).
- Documented `chain_id`'s RLP encoding explicitly as minimal big-endian (standard RLP integer encoding, no special casing needed).
- Added the full non-contiguous tag table (0–9, noting 6/7/9 gaps were deliberate) and full RLP argument shapes for Mint (tag 6), Burn (tag 7), and ChainInit (tag 9), including `credit_ref`/`redemption_ref` format (64 lowercase hex, shared exactly-once namespace) and the "burn first, pay second" ordering rationale.

**`docs/clutch-node/clt-economics.md`** — full rewrite (see Escalation note below on why I did this as a rewrite, not a light edit).
- Replaced the entire block-reward emission model with the fully-reserved/redeemable framing: the peg (1 USD = 1,000,000 CLT, shown with the `$5.00 = 5,000,000 CLT` reasoning per the style guide), Mint/Burn as the only supply-changing operations, and the flat `tx_fee` funding validators instead of block rewards.
- Added an explicit guardrail box: the chain enforces mint authority and exact supply accounting, but **cannot** verify off-chain reserve exists — that's process/reconciliation, not consensus. This is the "never document a guarantee the code doesn't provide" instruction applied directly.
- Referrer fee example recomputed at the new peg with floor rounding (bps, not percent) and an explanation of why ceiling rounding was actively wrong before (2% of 3 units rounding up to 33%).

**`docs/clutch-node/configuration.md`** — full rewrite.
- Dropped `block_reward_amount`; added all 8 new/renamed consensus-parameter keys (`chain_id`, `is_testnet`, `tx_fee`, `mint_authority`, `faucet_address`, `faucet_allocation`, both `_bps` referrer rates) with current testnet values.
- New section stating plainly that these params are committed by the genesis `ChainInit` and must be byte-identical across every node, or peers refuse to sync (genesis hash mismatch) — not a silent fork.

**`docs/clutch-node/transaction-types.md`** — full rewrite. Added Mint, Burn, ChainInit sections with exact tag numbers, RLP argument shapes, and their guarantees (authority-gated + exactly-once for Mint; permissionless + optional ref for Burn; genesis-only for ChainInit). Rewrote the referrer-fee section for bps/floor rounding and added the flat-fee validator-compensation section.

### Hub API

**`docs/clutch-hub-api/graphql.md`** — heaviest edit in this group.
- All fare/farePaid/`accountBalance` fields: `Int!` → `String!`, with an explanation of the 32-bit overflow at ~$2,147.
- Added `ChainInfo` type and `chainInfo` query (public, 5 fields — explicitly noted it does **not** include `latest_block_index`, unlike the node's raw RPC, to avoid implying parity that doesn't exist).
- Added `createUnsignedBurn` mutation with its exact args (`amount: String!`, `redemptionRef: String`).
- Added an explicit note that `createUnsignedMint` does not exist on this surface — Mint is node-only.
- Updated the unsigned-transaction JSON example to include `chain_id`.
- Fixed the `generateToken` challenge string in-place (still showed the old chain_id-less format).

**`docs/clutch-hub-api/authentication.md`** — challenge format updated to `clutch-auth:{chain_id}:{publicKey}:{timestamp}` throughout, with the replay-across-chains rationale; auth matrix updated for `chainInfo` (public) and `createUnsignedBurn` (guarded).

**`docs/clutch-hub-api/errors.md`** — added `createUnsignedBurn`/`chainInfo` to the guarded/public field lists. (This doc's error-message catalog was already accurate against source — confirmed via the research agent that `MutationError` is dead code never actually returned, so I did not add any error variants for it.)

**`docs/clutch-hub-api/faucet.md`** and **`docs/clutch-hub-api/subscriptions.md`** — not in the original 17, found stale:
- `faucet.md`: added a note that the faucet gate is a **boot-time panic** in the Hub API process (not a per-request check, and not node-side — the node itself has no faucet at all). Also flagged (see Escalation) that `faucet_amount_clt = 1000` is $0.001 at the new peg — smaller than the flat `tx_fee` itself.
- `subscriptions.md`: added the same String-scalar note as `graphql.md` (its example queries don't show types, so it wasn't outright wrong, just silent).

### SDK

**`docs/clutch-hub-sdk-js/api-reference.md`** — heaviest edit in this group.
- Constructor signature gains optional `chainId` (4th arg); explained it's pinned from app config and never read back from the hub.
- New `chain_id and verifyUnsignedTransaction` section: exact `ExpectedTx`/`VerifiedTx` types, what's checked (strict chain_id equality, not just presence), and the explicit non-verification of `referrer` (display-only, no signed-quote flow yet).
- Documented `verifyUnsignedTransaction` as invoked via `signTransaction`'s optional third argument, not a separately-called function — matches the actual call pattern.
- Added `createUnsignedBurn`/`BurnArgs`, `getChainInfo()`/`ChainInfo` type, `formatUsd()` with its exact floor-not-round behavior, and a "No createUnsignedMint" note.
- All fare/amount/balance types: `number` → `bigint`.
- Added a "v3 breaking changes" section at the bottom summarizing all of the above for upgraders.

**`docs/clutch-hub-sdk-js/overview.md`** and **`usage.md`** — constructor examples updated with `chainId`; fare literals updated to `bigint` (`5_000_000n` style, each with the `$5.00` reasoning); added a "Verify before you sign" section and a "Burn (redeem CLT)" section to `usage.md`.

**`docs/clutch-hub-sdk-js/subscriptions.md`** — not in the original 17: `subscribeAccountBalance`'s documented emission type was still `number`; fixed to `bigint`.

### Lighter touches (per the brief's "remaining pages" instruction)

- **`docs/demo-app/user-flows.md`** — noted balance/fare fields are `bigint` and that the demo formats them via `formatUsd()`.
- **`docs/getting-started/app-developer-incentives.md`** — percent→bps throughout, ceiling→floor, all CLT examples recomputed at the peg with USD shown alongside, block-reward mention replaced with flat-tx-fee explanation.
- **`docs/getting-started/ride-lifecycle.md`** — SDK code examples updated (`chainId` constructor arg, `bigint` fare literals, `formatUsd` for display), GraphQL example `fare: Int!` → `String!`.
- **`docs/intro.md`** — key-features list and CLT-economics table rewritten for the peg/fully-reserved framing and flat fee; example recomputed.
- **`docs/reference/faq.md`** — added CLT/peg FAQ entry, updated auth challenge string, added bigint/`verifyUnsignedTransaction`/non-testnet-faucet entries.
- **`docs/reference/security.md`** — auth challenge string, chain_id replay-protection bullet, `verifyUnsignedTransaction` threat-model row, faucet non-testnet boot-panic bullet, `mint_authority` key-management row (flagged as the highest-value key in the system, needing a dedicated treasury key rather than a validator/dev key).
- **`docs/reference/transaction-flow.md`** — sequence diagram shows the chain-bound challenge and the optional pre-sign verify step; transaction-hash-linking table gained a `Burn`/`redemption_ref` row.
- **`docs/clutch-node/json-rpc.md`** — not in the original 17, found stale: added the full `get_chain_info` method (params, response shape, and why `total_supply` alone is a string), updated `send_raw_transaction`'s validation description (chain_id check, fee-inclusive balance check) and the error-handling table (removed the implicit "transactions are free" framing).

## Stale content found beyond the original list

1. `docs/clutch-node/json-rpc.md` — missing `get_chain_info` entirely; described transaction admission without the chain_id/fee checks.
2. `docs/clutch-hub-api/faucet.md` — didn't mention the non-testnet boot-time gate; and its own `faucet_amount_clt` example value is stale relative to the peg (see Escalation).
3. `docs/clutch-hub-api/subscriptions.md` — silent on the Int→String scalar change (not wrong, but would mislead a strongly-typed client).
4. `docs/clutch-hub-sdk-js/subscriptions.md` — `subscribeAccountBalance` documented as emitting `number`; actually `bigint`.
5. One self-inflicted broken anchor (`#chaininfo` in `api-reference.md`, referencing a heading that doesn't exist) — caught by `npm run build` and fixed; see Build result.

## Build result

**PASS.** First run failed with exactly one broken anchor (`docs/clutch-hub-sdk-js/api-reference.md` linking to a nonexistent `#chaininfo` heading); fixed by pointing the link at the existing `#types` section instead. Second run:

```
[SUCCESS] Generated static files in "build".
```

Node v24.13.1 (>=20 satisfied), run on host per instructions (docs build, not a Rust build).

## Items needing a human editorial decision

1. **`faucet_amount_clt = 1000` in `clutch-hub-api/config/default.toml` (and `clutch-deploy`'s copy) is almost certainly stale relative to the peg.** At 1 USD = 1,000,000 CLT, a drip of 1000 CLT is $0.001 — smaller than the flat `tx_fee` (also 1000 CLT) a recipient would need to pay just to send one transaction. This reads like a config value that should have been updated alongside the peg change but wasn't. I documented the current value accurately and added a caution box in `faucet.md` rather than silently changing what the docs claim the config does — but the config itself (a separate repo's concern, `clutch-hub-api`, not `clutch-docs`) likely needs a real fix, probably to something like `1_000_000` (a $1 drip) or higher. Flagging rather than fixing since it's not a docs bug, and I don't have authority to change another repo's config in this task.
2. **Hub API's `chainInfo` GraphQL query omits `latest_block_index`, which the node's underlying `get_chain_info` RPC does return.** This looks like an oversight in the Hub API's resolver (it maps 5 of the node's 8 response fields) rather than a deliberate design choice — nothing in the Hub API source explains why it's dropped. I documented both shapes accurately as they exist today, but if this was meant to be forwarded, that's a one-line fix in `clutch-hub-api`, not a docs change.
3. **No editorial call needed on `clt-economics.md`'s restructuring** — per the escalation clause, I considered whether this page needed to flag for human review rather than a rewrite, since its entire premise (block-reward emission) is gone. I did not escalate: the brief explicitly names this page and describes exactly the replacement content to write ("replace it with the fully-reserved/redeemable framing, the peg, the fee model, and Mint/Burn as the only supply-changing operations"), so writing that content is the assigned task, not a discretionary restructuring. Flagging here only so the reviewer knows I treated it as in-scope rather than silently deciding on my own.

## Commit

`28f07c7` — "docs: update for the treasury-break release (peg, Mint/Burn, chain_id, fees)". 22 files changed (21 doc files + this report), 708 insertions / 156 deletions. On branch `treasury-break`, not pushed.
