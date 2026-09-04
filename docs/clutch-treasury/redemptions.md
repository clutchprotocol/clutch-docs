---
sidebar_position: 4
---

# Redemptions

:::danger Redemptions are currently disabled
`APP_REDEMPTIONS_ENABLED` is `false`. This is not because the payout rail is a stub — it is a real TRC-20 transfer, described below — but because its rollout checklist has not finished: the payout float still needs funding, and reconciliation needs to confirm it reads `ok` with the float counted (see [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation)). This page describes the design as it exists in code today, not a live feature. `POST /api/v1/redemptions` and `GET /api/v1/redemptions/:id` both return `503` while the flag is off.
:::

Redeeming reverses a deposit: burn CLT on the Clutch chain, receive USDT on Tron. The two legs happen in a fixed order, and that order is the whole safety argument.

Conversion is at par, and no redemption fee is charged — though a fee on exactly this leg is the intended answer to who pays the treasury's running costs (see [Who pays for the network](/clutch-node/clt-economics#who-pays-for-the-network)).

## Burn first, pay second

The `Burn` transaction is the authorization. Once it is mined, it is final — the CLT is gone, permanently and unconditionally, whether or not the payout that follows ever succeeds. The payout, by contrast, can fail transiently and be retried against the recorded reference, because nothing about retrying a *payment* is dangerous the way retrying a *burn* would be.

Reversing that order — paying first and burning second — would let someone collect the USDT and then have their burn fail or never confirm, which a fully-reserved token cannot absorb: CLT would still exist that the payout already assumed was gone. This is the same principle [CLT Economics](/clutch-node/clt-economics#burn-redemption) states for `Burn` in general; a redemption is that principle with an off-chain leg attached.

A redemption only advances once its burn is **confirmed on chain and matches on all three of reference, amount, and sender**. A reference alone is not proof of anything — it is visible in the mempool before the transaction that carries it is ever included — so a burn that names the right reference but the wrong amount or the wrong sender does not pay out; it fails the redemption outright and pages a human, rather than being treated as a near-miss worth accepting.

## Requesting a redemption

A redemption names a destination Tron address and an amount. The address is checked for real — a full base58check decode against Tron's version byte, not a "starts with T, right length" shape test, so a single mistyped character is rejected rather than silently accepted and paid to nowhere. The redeeming identity is always the caller's own authenticated identity; there is no field for naming a different account, for the same reason there is none on the deposit side.

## The payout float

Payouts are paid from a float, not from custody and not from any deposit address. The float is derived at its own path, distinct from every deposit address and from the fee account that pays for sweeps, so it can never collide with either. An operator tops it up from custody as needed.

That separation is the actual security boundary here, and it is worth being precise about what it protects against. `tron-signer`'s payout endpoint takes a destination and an amount — unlike the sweep endpoint, it has to, because a payout has no other way to say where the money goes. Widening that endpoint is what makes it different from sweep: its safety depends on the bearer token and the internal-only network actually holding, not on the request shape alone. What bounds the damage if they don't is the float itself — the caller can never reach custody or a deposit address through this endpoint, so the absolute worst case is the float's own balance, capped again by a per-transaction limit on top of that.

## Claim first, ask questions never

Once a burn is confirmed, the redemption is marked as **submitted** — before the payout is even attempted, not after. A crash between those two moments is indistinguishable from a lost response, which is exactly the point: both are treated identically, because a TRC-20 transfer carries no memo field, so there is no way to later ask Tron "did this specific redemption already pay out" by inspecting the chain. Matching on address and amount alone is not safe either — a person legitimately redeeming the same amount to the same address twice is normal, not a duplicate.

That forces a hard rule: only a reply that **proves** nothing was broadcast — the float is dry, the request is over the per-transaction cap — returns a redemption to the queue for an automatic retry. Anything else — a timeout, an unreadable response, a claimed success with no transaction id to point at — leaves the redemption exactly where it is, claimed, and pages a human. It is never retried automatically. An ambiguous payout is rare; a stuck redemption is recoverable by a human resolving it by hand; a double payment is not recoverable at all. Between those, the design accepts the first two to avoid the third.

Even a successful reply is not the end of it: the payout only completes once its transaction is independently confirmed on chain **and** verified to have actually moved value — a transfer that lands in a block but reverts (out of energy, for instance) is a dead end that pages a human rather than being retried, because the one signer call this redemption gets has already been spent.

## Caps

Two independent caps bound a single payout, in different services and different units — they happen to be numerically equal at par, but they are not the same configuration value, on purpose:

- A **per-transaction cap**, enforced in `tron-signer` in micro-USDT, checked before anything is signed.
- A **rolling 24-hour cap**, enforced in `treasury-service` in CLT base units, mirroring the mint side's daily cap.

The treasury's breaker gates payouts exactly as it gates minting: a treasury that has halted because its books do not add up must not ship money out the other door either, whatever state any individual redemption is in.

## Related

- [Overview](/clutch-treasury/overview) — why `tron-signer` is the only thing that can move money
- [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) — the breaker that also gates payouts
- [CLT Economics](/clutch-node/clt-economics#burn-redemption) — `Burn` on the chain side
