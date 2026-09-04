---
sidebar_position: 3
---

# Reserves and Reconciliation

CLT's peg is only as good as the process that keeps it honest, since the chain itself cannot check it ([Overview](/clutch-treasury/overview)). This page covers how the treasury computes what actually backs CLT, how it compares that against what it has minted, and what stops it from minting past that line.

## Reserve and liability

Two figures are supposed to move together:

- **Liability** — the CLT the treasury's own ledger has recorded as minted, credited from `Mint` transactions it submitted itself.
- **Reserve** — the USDT actually available to back it, which is the sum of three places, not one:
  - **Custody** — the main treasury Tron address.
  - **Unswept deposits** — every deposit address that still holds USDT nobody has moved into custody yet. Each address is counted **once**, no matter how many separate credited deposits it is backing — counting a reused address once per deposit would inflate the reserve, and an inflated reserve is the dangerous direction: it licenses minting against money that was already counted.
  - **The payout float** — the small balance `tron-signer` pays redemptions from (see [Redemptions](/clutch-treasury/redemptions)). It backs CLT exactly like custody does, and leaving it out would make the very first top-up into it look like a shortfall.

An address moving from "unswept deposit" to "custody" during a sweep does not change the reserve total — it is the same USDT counted under a different bucket, which is exactly why sweeping never writes a ledger event of its own. It only records that the sweep happened.

## Sweeping

Once a deposit is credited, its USDT still sits at that user's own derived address until it is swept into custody. Sweeping happens once an address's balance crosses a threshold, or once it has been waiting long enough — the age rule exists so a small deposit under the threshold does not sit at its own address forever, fragmenting the reserve across addresses nobody ever revisits again.

Under the age rule sits a floor, and it is there for the opposite reason. A sweep is a TRC-20 transfer that costs TRX for energy, so on a small enough balance it spends more than it recovers. An age rule with no lower bound eventually does exactly that, once per dust address, forever. Below the floor an address is simply left alone, which costs nothing by comparison: an unswept address is already counted in the reserve, so the total is identical either way, and since deposit addresses are permanent per user, the balance sweeps by itself the moment that user's next deposit lifts it over the line. The floor gates the threshold as well as the age rule — spending more than the balance is wrong whichever of the two asked for the sweep.

`treasury-service` decides *when* to sweep; it does not hold a key to do it. It asks `tron-signer` to sweep by deposit **index only** — never a destination, never an amount. The destination is baked into `tron-signer`'s own configuration, so nothing a caller sends can redirect a sweep. That means the worst outcome of a fully compromised `treasury-service` asking for sweeps is a real deposit reaching the real treasury slightly earlier than it otherwise would have — which is where it was going anyway.

## Reconciliation

On a schedule, a separate job compares three numbers: the Clutch chain's own reported supply (via `get_chain_info`), the treasury's recorded liability, and the reserve — read live from Tron via TronGrid, the same custody-plus-unswept-plus-float sum described above. This is the one part of the whole system that depends on an external data source rather than the treasury's own bookkeeping, and it is treated accordingly:

- **If the reserve can't be read** — TronGrid is down, or errors — **no run is recorded at all.** A synthetic zero would read as "the reserve was drained" and halt minting on a mere outage; a fabricated "ok" would do the opposite and let minting continue on data nobody actually saw. An honest gap is safer than either.
- **`ok`** — reserve covers liability, on-chain supply matches what the ledger believes it minted (allowing for a mint that is on-chain but not yet watcher-credited, which self-resolves within moments).
- **`mismatch`** — either the reserve has fallen below liability, or the chain shows more CLT minted than the ledger can account for. Minting halts immediately and a P1 fires. This is not a metric to watch; it is the one condition a fully-reserved token cannot tolerate for any length of time.
- **`over_backed_drift`** — the ledger believes it minted more than the chain shows. A single run reading this is ordinary — a mint takes a moment to land on-chain after the ledger records it — so one occurrence is a warning, not an alarm. The **same gap persisting across consecutive runs** is a different claim entirely: it means a mint the ledger believes happened is missing on chain, which is CLT someone is owed but that does not exist. That escalates to a P1.

## The mint gate

Before any `Mint` reaches the chain, several independent checks all have to pass — and the two kinds of check depend on very different things:

| Control | Scope | Needs live external data? |
|---------|-------|----|
| Manual halt | Everything | No |
| Per-transaction cap | One mint | No — fixed configuration |
| Rolling 24-hour cap | All mints in a trailing day | No — the treasury's own recent history |
| Backing-ratio check | Every mint, against projected liability | No — the treasury's own recorded balances |
| Reconciliation freshness | Every mint | Indirectly — refuses to mint if the last scheduled reconciliation (within 48 hours) was a `mismatch`, or if none ran at all in that window |

The caps and the backing-ratio check are deliberately cheap and self-contained: they answer instantly from the treasury's own numbers and cannot be blocked or fooled by an outage somewhere else. Reconciliation is the opposite by necessity — it is the only check that actually looks at Tron — so the mint gate does not call TronGrid itself on every mint; it just refuses to act on stale or bad news from the job that does. A reconciliation outage long enough to blow past that 48-hour window stops minting on its own, without anyone having to notice the outage first.

This gate is not a one-time gauntlet at approval. Whatever satisfied approval — a human working from an early read of the same checks, or the treasury's own verifier satisfied by matching on-chain evidence — the full gate is checked again, unconditionally, immediately before the mint is actually signed and submitted. Time passes between the two, and only that final check is authoritative. A mint denied at that last step is never silently dropped: the deposit behind it is retried, and if it genuinely cannot go through — a single deposit larger than the per-transaction cap will never fit under it, no matter how many times it is retried — it eventually surfaces to a human as `needs_manual` rather than vanishing (see [Deposits](/clutch-treasury/deposits)).

## Four-eyes

Creating a mint intent and approving it are separate acts, and the database enforces that they come from different identities — the same actor cannot do both. For a deposit, "approving" is not a rubber stamp on whatever the request claims: the treasury independently re-fetches the specific transfer at the specific address the deposit intent names, directly from Tron, and only approves if that evidence actually matches. It never trusts the amount or the address it was merely told.

## Related

- [Overview](/clutch-treasury/overview) — the three services and what each may do
- [Deposits](/clutch-treasury/deposits) — the user-facing side of minting
- [Redemptions](/clutch-treasury/redemptions) — the payout float and how it is bounded
- [CLT Economics](/clutch-node/clt-economics) — the chain-side half of the peg
