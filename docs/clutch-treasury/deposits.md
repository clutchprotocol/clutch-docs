---
sidebar_position: 2
---

# Deposits

Turning USDT into CLT starts with one address, handed out once per user and reused forever. There is no amount to declare, no minimum, and no expiry: send any amount of USDT (TRC-20) to your address and it is credited in full.

## One permanent address per user

Your deposit address is derived from the treasury's account xpub at `m/44'/195'/0'/0/i` — the same path `tron-signer` derives the matching private key from, so the two always agree on which address is whose (see [Overview](/clutch-treasury/overview)). The first time you ask for it, it is derived and stored; every call after that returns the same address. It never changes and it never closes.

That permanence has a real tradeoff, and it is deliberate rather than an oversight: because you always pay the same address, anyone who knows it can see every deposit you have ever made to it on a public block explorer, and link them together as one person's activity. Exchanges work the same way, for the same reason — a fresh address per deposit would bring back the exact problem this design replaced (see below). If that linkage matters to you, treat your Clutch deposit address the way you would any other exchange deposit address.

## What "credited" means

Each on-chain transfer to your address becomes its own credit, in full, the moment it is observed and matched to your address:

- Two separate transfers are **two** credits, each for what actually arrived.
- The same transfer, observed again on a later poll, is still **one** credit — every credit is keyed to its own Tron transaction id, so re-observing it changes nothing.
- There is no expected amount to compare against and nothing to "complete" — the old model asked you to pay a specific figure at a specific address and matched partial or rounded payments against it; the current one has nothing to match, because the address alone identifies who paid. Whatever number of micro-USDT actually lands, that is what gets credited.

The only floor is that a transfer has to move something — a transfer of exactly zero (a real, if unusual, kind of TRC-20 message) is not a deposit and credits nothing.

## Detection: hot and cold

There is no webhook. Every deposit address is polled directly, and TRON has no way to watch a group of derived addresses at once — each one is its own request. To keep that affordable as the number of users grows, addresses are polled in two tiers:

- **Hot** — opening the deposit panel marks your address hot for a window after that moment. Hot addresses are always polled first, so a deposit made shortly after you look for your address is detected quickly.
- **Cold** — every other address rotates through a fixed budget of addresses per polling pass, oldest-checked first. A deposit to an address that was never marked hot is still detected; it just waits its turn in the rotation instead of jumping the queue.

| Setting | What it controls | This testnet's value |
|---------|-------------------|-----------------------|
| Hot window | How long an address stays on the fast tier after the deposit panel is opened | 24 hours |
| Per-pass budget | Addresses polled per rotation pass, hot ones first | 50 |

This means detection is quick in the common case — someone who just opened the app to get their address — but never instant, and a deposit from someone who never opened the panel is still found, on the cold rotation, without cost scaling with how many users exist.

## The API

### `POST /api/v1/deposits`

Takes no body. Returns the caller's deposit address, deriving and storing it on first call:

```json
{ "address": "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH" }
```

The CLT beneficiary is always the caller's own authenticated identity — the JWT `pk`, in address form (`0x` + 40 hex digits). There is deliberately no field in the request for naming a different beneficiary: under a permanent address, a typo or someone else's address in that field would become this user's mint destination forever, with no later request able to correct it, so it was removed rather than left as a foot-gun.

A token carrying a public key instead of an address is refused outright with `400`, not silently normalized into one:

```json
{ "error": "deposits require an address-form token (0x + 40 hex); public-key tokens are not accepted" }
```

Calling this endpoint again returns the same address — it is idempotent because you have exactly one.

### `GET /api/v1/deposits`

Your own recent deposits, newest first, capped at twenty rows:

```json
{ "deposits": [
  { "id": "…", "status": "credited", "amount_usdt": 50000000,
    "tron_tx_id": "e5ebca…", "created_at": "2026-09-03T22:09:26Z" }
] }
```

`amount_usdt` here reports what actually arrived, not what was once expected — there is nothing left to expect. You can only ever see your own deposits; the query is scoped to your identity, not filtered afterward. This is a panel, not a ledger: there is no pagination, and an old, never-paid legacy invoice (from before permanent addresses existed) is excluded entirely rather than shown as noise.

## Status vocabulary

The API returns the deposit's raw status; the table below is what each one means and how the reference demo app's deposit panel presents it.

| Status | Shown as | Meaning |
|--------|----------|---------|
| `confirmed` | Detected | Seen on chain and logged. Minting has not been requested yet. |
| `mint_requested` | Minting | The treasury has been asked to mint against this deposit. |
| `credited` | Credited | CLT is in your balance. |
| `needs_manual` | Needs review | A human has to act before this deposit can be minted. Your USDT is safely held; it just is not CLT yet. |

An unrecognized status is shown as-is rather than guessed at — if the backend ever gains a new state, a client sees the raw word instead of a misleading translation.

### The per-transaction mint cap

A deposit large enough to exceed the treasury's per-transaction mint cap does not mint automatically. The USDT has already been credited to your account in the ledger and is not at risk — it is sitting in custody exactly as it should be — but turning it into CLT requires a human to review and approve it by hand, which shows up as `needs_manual`. See [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) for what the cap is protecting against.

## Related

- [Overview](/clutch-treasury/overview) — the three services and why the split exists
- [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) — caps, sweeping, and the breaker
- [CLT Economics](/clutch-node/clt-economics) — what `Mint` guarantees on-chain, and what it does not
