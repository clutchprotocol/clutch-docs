---
sidebar_position: 2
---

# Deposits

Turning USDT into CLT starts with one address, handed out once per user and reused forever. There is no amount to declare and no expiry: send USDT (TRC-20) to your address and it is credited, less the network fee taken, and subject to a minimum and to limits. Read the section "Network fees, the minimum and the limits" below before you send anything on the mainnet.

## One permanent address per user

Your deposit address is derived from the treasury's account xpub at `m/44'/195'/0'/0/i` — the same path `tron-signer` derives the matching private key from, so the two always agree on which address is whose (see [Overview](/clutch-treasury/overview)). The first time you ask for it, it is derived and stored; every call after that returns the same address. It never changes and it never closes.

That permanence has a real tradeoff, and it is deliberate rather than an oversight: because you always pay the same address, anyone who knows it can see every deposit you have ever made to it on a public block explorer, and link them together as one person's activity. Exchanges work the same way, for the same reason — a fresh address per deposit would bring back the exact problem this design replaced (see below). If that linkage matters to you, treat your Clutch deposit address the way you would any other exchange deposit address.

## What "credited" means

Each on-chain transfer to your address becomes its own credit, for the amount that arrived less the network fee (see below), the moment it is observed and matched to your address:

- Two separate transfers are **two** credits, each for what actually arrived.
- The same transfer, observed again on a later poll, is still **one** credit — every credit is keyed to its own Tron transaction id, so re-observing it changes nothing.
- There is no expected amount to compare against and nothing to "complete" — the old model asked you to pay a specific figure at a specific address and matched partial or rounded payments against it; the current one has nothing to match, because the address alone identifies who paid. Whatever number of micro-USDT actually lands, that is the amount the credit is made from.

The only floor in this section's terms is that a transfer has to move something — a transfer of exactly zero (a real, if unusual, kind of TRC-20 message) is not a deposit and credits nothing. The next section adds the real minimum.

## Network fees, the minimum and the limits

The testnet and the mainnet both run the **GasFree rail**: your address is a GasFree account owned by your derived key, and a relay moves the USDT out of it by a permit the treasury signs, so the address never needs any TRX. The relay charges its fee in USDT. The treasury takes a network fee from your deposit before it mints, and it takes the **maximum** the relay is allowed to charge, not the relay's live price. That is deliberate: the treasury must be sure that the reserve covers every CLT it mints, even if the relay raises its price. So:

- A **first** deposit to an address pays the relay's activation fee plus its transfer fee. On the mainnet the treasury takes **$4.00** for that. Each later deposit pays only the transfer fee, and the treasury takes **$2.00**. On the testnet the figures are smaller ($2.00 and $0.50). The app shows the fee before you pay.
- **There is no service fee today.** The operator's fee on top-ups (1% of the CLT a deposit mints, at least $0.50, never on a first deposit) ran on the mainnet and the testnet from 2026-10-23 and was turned off on 2026-10-26, while there are few users. It covers every way of topping up: a deposit address, Pay from TronLink and USDT on BNB Smart Chain. The treasury can turn it back on without a new release; the app shows it in the deposit panel whenever it is on.
- **The relay charges less than that today:** $1.50 to activate and $1.50 per transfer on the mainnet, so $3.00 on a first deposit and $1.50 on later ones. The difference ($1.00 and $0.50) is **not refunded**. It stays in the reserve as extra backing, and the treasury uses it for its own network costs, such as the one-time setup of its payout wallet.
- A deposit that is below the **minimum after the fee** mints nothing and waits for a person to decide: **$1.00** on the mainnet and the testnet. On a GasFree deposit address the fee comes first, so send at least $5.00 the first time and $3.00 after that; Pay from TronLink and BNB Smart Chain take no relay fee, so $1.00 is enough there. The USDT is not lost. It stays counted in the reserve.
- The **mint caps** bound what is credited. On the mainnet a single deposit credits at most **$100** of CLT and a rolling 24 hours at most **$200**. A deposit that would credit more than the first waits for a manual approval, and one that would pass the second waits and is credited when older mints leave the window. In both cases your USDT stays at your address, counted in the reserve, and no CLT exists for it until it is credited.

That extra is what pays the treasury's own network costs. A payout wallet needs up to $4.00 of surplus once, to set itself up, before the first withdrawal can be paid: see [Redemptions](/clutch-treasury/redemptions). The treasury has no money of its own, and the setup must not be paid out of what users hold. On the mainnet the maintainer sent that surplus directly before any deposit, and the payout wallet was activated on 2026-10-16.

## Pay from TronLink

**On the testnet and the mainnet since 2026-10-23.**

If you are signed in with TronLink, you can skip the deposit address and its network fee. The **Pay from TronLink** button in the deposit panel asks TronLink to send USDT from your own TRON address straight to the treasury's payout wallet. Nothing has to be moved afterwards, so there is no relay fee and no first-deposit fee. TronLink charges TRON's own network fee in TRX from your wallet, usually a few TRX, so keep some TRX there. The service fee above still applies from your second deposit.

This works because a TronLink account and a Clutch account are one key: the `T…` address TronLink shows and your `0x…` Clutch address are the same 20 bytes. Only your key can send from that TRON address, so the treasury credits a transfer from it to you.

- **Press the button first, then pay.** Pressing it tells the treasury that you will pay from your TRON address, and only transfers that arrive after that are credited. The app does both steps for you.
- **Pay from TronLink only, never from an exchange.** A transfer from any other address (an exchange's withdrawal, say) cannot be linked to anyone. It is not credited, and an operator has to send it back by hand. Use your deposit address for exchange withdrawals.
- The **minimum** and the **mint caps** are the same as for a deposit address. No network fee is taken, so the whole amount counts towards the minimum.
- Before it mints, the treasury checks on the TRON chain that the transfer reached its own payout wallet, that it came from the TRON address of the account it credits, and that it mints no more than arrived.

The deposit shows under **Recent deposits** marked **TronLink**, with the same statuses as any other.

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

### Authentication

Every route below requires `Authorization: Bearer <token>` — the same JWT the Hub API issues via `generateToken` (see [Hub API Authentication](/clutch-hub-api/authentication)), not a token this service mints itself. The orchestrator decodes it as HS256 with claims `{pk, exp}` — the identical shape the hub issues — using the **same** `jwt_secret` the hub signs with; `Bearer` is stripped from the header before decoding. If the two secrets ever disagree, every route here fails closed with a plain `401`, not an error that would hint at the mismatch.

On the mainnet, the orchestrator also checks the caller against its list of allowed accounts, after the token and before it creates anything, and answers `403` to any other account. The list has been everyone since 2026-10-05.

This is why the browser calls this service directly instead of going through the Hub API or the SDK: a token obtained from the hub is already valid here, because both services check it against the same secret.

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

### `POST /api/v1/direct-topups`

Takes no body. Records that the caller will pay from the TRON address of their own key (see "Pay from TronLink" above), and answers where to pay:

```json
{ "pay_to": "T…", "from": "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH",
  "usdt_contract": "T…", "min_deposit_usdt": 1000000 }
```

`from` is derived from the token's address, never taken from the request. Only transfers from `from` to `pay_to` that arrive after the first call are credited. The answer is `503` where direct top-ups are switched off.

### `GET /api/v1/deposits`

Your own recent deposits, newest first, capped at twenty rows:

```json
{ "deposits": [
  { "id": "…", "status": "credited", "amount_usdt": 50000000,
    "tron_tx_id": "e5ebca…", "created_at": "2026-09-03T22:09:26Z" }
] }
```

`amount_usdt` here reports what actually arrived, not what was once expected — there is nothing left to expect. You can only ever see your own deposits; the query is scoped to your identity, not filtered afterward. This is a panel, not a ledger: there is no pagination, and an old, never-paid legacy invoice (from before permanent addresses existed) is excluded entirely rather than shown as noise.

### `GET /api/v1/deposits/:id`

A single deposit, by id:

```json
{ "id": "…", "clt_address": "0x...", "amount_usdt": 50000000,
  "pay_amount_usdt": 50000000, "status": "credited",
  "invoice_id": "…", "expires_at": null }
```

Owner-checked: an id that exists but belongs to a different `user_pk` returns `404`, identical to an id that does not exist at all — never `403`. Confirming that a deposit exists for someone else's account would itself be information a caller has no business getting.

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

A deposit large enough to exceed the treasury's per-transaction mint cap does not mint automatically. The USDT has already been credited to your account in the ledger and is not at risk — it is in the reserve exactly as it should be — but turning it into CLT requires a human to review and approve it by hand, which shows up as `needs_manual`. See [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) for what the cap is protecting against.

## Related

- [Overview](/clutch-treasury/overview) — the three services and why the split exists
- [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) — caps, sweeping, and the breaker
- [CLT Economics](/clutch-node/clt-economics) — what `Mint` guarantees on-chain, and what it does not
- [Hub API Authentication](/clutch-hub-api/authentication) — how the JWT sent to this API is issued
