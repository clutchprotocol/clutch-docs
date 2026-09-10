---
sidebar_position: 4
---

# Redemptions

:::info Redemptions are live on this testnet
`APP_REDEMPTIONS_ENABLED` is `true`, set directly in `docker-compose.treasury.yml` rather than read from `.env`. Payouts are USDT on the Nile testnet.

A single redemption is bounded twice, in two services that do not share the value. `payment-orchestrator` refuses a request above `APP_MAX_REDEMPTION_CLT` before any burn happens, and `tron-signer` independently refuses a payout above its own per-transaction cap. Both stand at $25 today, deliberately equal so a request the signer would reject can never become a burn nobody can pay. A rolling 24-hour ceiling in `treasury-service` sits above both.

A redemption that finds the float dry is returned to the queue and retried, because a dry float proves nothing was broadcast. Every other unclear outcome stops and pages a human instead. The CLT is already gone by then either way — which is what the next section is about.
:::

Redeeming reverses a deposit: burn CLT on the Clutch chain, receive USDT on Tron. The two legs happen in a fixed order, and that order is the whole safety argument.

A redemption fee is charged on this leg, and it is the only revenue the protocol takes ([Who pays for the network](/clutch-node/clt-economics#who-pays-for-the-network)). You burn the full amount and receive that much less in USDT; the difference stays in the reserve. Both numbers are quoted back when the redemption is created — `amount_clt` is what to burn, `payout_amount_usdt` is what arrives — and the quote is stored at that moment rather than recomputed later, so a fee change can never land between what you accepted and what you are paid.

## Burn first, pay second

The `Burn` transaction is the authorization. Once it is mined, it is final — the CLT is gone, permanently and unconditionally, whether or not the payout that follows ever succeeds. The payout, by contrast, can fail transiently and be retried against the recorded reference, because nothing about retrying a *payment* is dangerous the way retrying a *burn* would be.

Reversing that order — paying first and burning second — would let someone collect the USDT and then have their burn fail or never confirm, which a fully-reserved token cannot absorb: CLT would still exist that the payout already assumed was gone. This is the same principle [CLT Economics](/clutch-node/clt-economics#burn-redemption) states for `Burn` in general; a redemption is that principle with an off-chain leg attached.

A redemption only advances once its burn is **confirmed on chain and matches on all three of reference, amount, and sender**. A reference alone is not proof of anything — it is visible in the mempool before the transaction that carries it is ever included — so a burn that names the right reference but the wrong amount or the wrong sender does not pay out; it fails the redemption outright and pages a human, rather than being treated as a near-miss worth accepting.

## Requesting a redemption

A redemption names a destination Tron address and an amount. The address is checked for real — a full base58check decode against Tron's version byte, not a "starts with T, right length" shape test, so a single mistyped character is rejected rather than silently accepted and paid to nowhere. The redeeming identity is always the caller's own authenticated identity; there is no field for naming a different account, for the same reason there is none on the deposit side.

## The payout float

Payouts are paid from a float, not from custody and not from any deposit address. The float is derived at its own path, distinct from every deposit address and from the fee account that pays for sweeps, so it can never collide with either. An operator tops it up from custody as needed.

That separation is the actual security boundary here, and it is worth being precise about what it protects against. `tron-signer`'s payout endpoint takes a destination and an amount — unlike the sweep endpoint, it has to, because a payout has no other way to say where the money goes. Widening that endpoint is what makes it different from sweep: its safety depends on the bearer token and the internal-only network actually holding, not on the request shape alone. What bounds the damage if they don't is the float itself — the caller can never reach custody or a deposit address through this endpoint, so the absolute worst case is the float's own balance, capped again by a per-transaction limit on top of that.

## Energy for payouts

Every payout is a TRC-20 transfer, and TRON charges energy for it: 64,285 units into an address that already holds USDT, 130,285 into one that does not. Left to itself the float pays for that by burning TRX at the chain's `getEnergyFee` — 100 sun per unit when measured on 2026-09-10 — so a payout to a fresh address costs about 13 TRX. That burn is what `APP_REDEMPTION_FEE_USDT` has to cover, and at a TRX price near $0.34 it is why the fee sits at $5.

Staking replaces the burn. TRX frozen for energy earns a daily energy allowance instead of being spent, and TRON lets any wallet **delegate** that allowance to any address without holding the recipient's key. So the float never stakes anything itself and `tron-signer` never grows a staking endpoint: an operator stakes on a wallet they control and points the energy at the float.

### How much to stake

TronGrid's `getaccountresource` returns `TotalEnergyLimit` and `TotalEnergyWeight`; their ratio is the energy one staked TRX earns per day. It moves with how much the whole network has staked — 9.60 on mainnet and 73.75 on Nile on 2026-09-10 — so read it rather than remember it. `PROBE=energy` prints it.

```
TRX to stake = payouts per day × 130,285 ÷ (TotalEnergyLimit ÷ TotalEnergyWeight)
```

One payout a day is about 13,571 TRX on mainnet and 1,767 on Nile. Size for the worst-case 130,285 rather than the average: the recipient is the user's own address, and there is no knowing whether it already holds USDT.

### Doing it

1. In a wallet you control, stake TRX for **energy** (Stake 2.0). The TRX stays yours; unstaking waits 14 days.
2. Delegate that energy to the payout float — `PAYOUT_FLOAT_ADDRESS`, or read it off `tron-signer` with the `treasury` probe. Delegation is its own transaction and needs nothing from the float.
3. Run `PROBE=energy`. The float's `EnergyLimit` should now be non-zero.
4. Make a payout. The probe reports the most recent one's `energy_fee`; it should be `0`.
5. Only then lower `REDEMPTION_FEE_USDT`, and `MIN_REDEMPTION_CLT` with it — the fee has to stay below the minimum, or the smallest allowed redemption is one the treasury refuses.

### What does not change

The float still needs liquid TRX. `tron-signer` checks the float's TRX balance before every payout and tops it up to 30 TRX when short; that check predates delegation and reads TRX, not energy, so with energy delegated the 30 TRX simply sits there. Nothing breaks if the delegation lapses either: the payout falls back to burning TRX exactly as before and the fee account refunds the float. Forgetting to renew costs money, not a stuck redemption.

Energy does not cover bandwidth. A transfer is about 345 bytes, every account gets 600 free per day, and past that it burns 0.345 TRX. Above one payout a day, delegate bandwidth as well or accept the small burn.

## Claim first, ask questions never

Once a burn is confirmed, the redemption is marked as **submitted** — before the payout is even attempted, not after. A crash between those two moments is indistinguishable from a lost response, which is exactly the point: both are treated identically, because a TRC-20 transfer carries no memo field, so there is no way to later ask Tron "did this specific redemption already pay out" by inspecting the chain. Matching on address and amount alone is not safe either — a person legitimately redeeming the same amount to the same address twice is normal, not a duplicate.

That forces a hard rule: only a reply that **proves** nothing was broadcast — the float is dry, the request is over the per-transaction cap — returns a redemption to the queue for an automatic retry. Anything else — a timeout, an unreadable response, a claimed success with no transaction id to point at — leaves the redemption exactly where it is, claimed, and pages a human. It is never retried automatically. An ambiguous payout is rare; a stuck redemption is recoverable by a human resolving it by hand; a double payment is not recoverable at all. Between those, the design accepts the first two to avoid the third.

Even a successful reply is not the end of it: the payout only completes once its transaction is independently confirmed on chain **and** verified to have actually moved value — a transfer that lands in a block but reverts (out of energy, for instance) is a dead end that pages a human rather than being retried, because the one signer call this redemption gets has already been spent.

## Caps

Two independent caps bound a single payout, in different services and different units. They are numerically equal today, but they are not the same configuration value, and with a fee set they no longer even measure the same amount — the treasury's counts the burn, the signer's counts the payout:

- A **per-transaction cap**, enforced in `tron-signer` in micro-USDT, checked before anything is signed.
- A **rolling 24-hour cap**, enforced in `treasury-service` in CLT base units, mirroring the mint side's daily cap.

The treasury's breaker gates payouts exactly as it gates minting: a treasury that has halted because its books do not add up must not ship money out the other door either, whatever state any individual redemption is in.

## Related

- [Overview](/clutch-treasury/overview) — why `tron-signer` is the only thing that can move money
- [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) — the breaker that also gates payouts
- [CLT Economics](/clutch-node/clt-economics#burn-redemption) — `Burn` on the chain side
