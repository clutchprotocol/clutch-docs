---
sidebar_position: 2
---

# Mainnet Readiness

**Status: not ready for real funds.** Last reviewed 2026-09-10.

Clutch runs a public alpha testnet. The CLT on it is backed by Tron **Nile testnet** USDT, which has no value and cannot be bought. Nothing in this stack should hold money you care about yet.

This page exists because "when is mainnet?" deserves a better answer than "no fixed date". Below is what has to be true before real funds, why each item matters, and what counts as evidence that it is done. It is the public half of a checklist maintained in the treasury repository, which carries the operational detail.

## How to read this

| Severity | Meaning |
|----------|---------|
| **Blocker** | Real funds cannot be accepted until this is done. No cap is small enough to work around it. |
| **Required** | Must be done before a public launch. May be deferred for a bounded pilot where total loss would be acceptable. |
| **Recommended** | Reduces risk. Skipping is a decision to record, not a gap to hide. |

Every item names what closes it. An item is closed by an artefact someone else can inspect, not by intent.

## The gate

Five things must all be true before any mainnet deposit address reaches a user:

1. The mint key and the payout key sit behind a KMS or hardware boundary, with a rehearsed recovery.
2. The payout rail has been proven on mainnet, with a real receipt behind the fee.
3. The chain runs a fresh mainnet genesis, with authorities under independent operators.
4. The treasury ledger has off-host backups and a restore that has actually been performed.
5. More than one person can operate and halt the system.

Everything below expands these, plus the product, review, and regulatory work around them.

## Key custody

**Blocker.** The mint authority is the only key that can create CLT, so its compromise means unbounded issuance against a fixed reserve. Today it is an environment variable, as is the payout key. That is a tracked gap rather than an oversight: `ChainSigner` and `PayoutSigner` already exist in the code as swap boundaries for a KMS-backed signer, and the named blocker is that signer plus a real key ceremony and tested recovery. See [Security](/reference/security) for the full key inventory.

One absence here is deliberate and will stay: nothing in the stack can spend from the reserve custody address. That is why redemptions are paid from a separate, bounded float instead, so the worst case for a compromised service is the float balance rather than the reserve. See [Clutch Treasury Overview](/clutch-treasury/overview).

**Closed by:** signing through KMS in the mainnet configuration, key material that has never existed outside it, a written ceremony record, and a recovery rehearsal in which both keys were restored into a fresh environment and used to sign.

## The payout rail

**Blocker.** The redemption payout path cannot be fully tested on the current testnet, and this is worth understanding if you are building on Clutch. Nile's test USDT contract sponsors its own energy, so every Nile payout reports zero energy fee whether or not energy delegation is working. A payout made before delegating reads identically to one made after. Mainnet USDT makes the sender pay, so the first mainnet payout is the first real test of the energy model.

The redemption fee follows from that. It was measured rather than chosen, from the energy a TRC-20 transfer burns, the chain's energy price, and the TRX price on the day. That energy price is a TRON governance parameter which has already halved once, so the fee has to be re-measured against mainnet rather than scaled from the testnet number. [Redemptions](/clutch-treasury/redemptions) documents the model.

A single redemption is already bounded twice, in two services that do not share the value, so a request the signer would refuse cannot become a burn nobody can pay. Those caps are the loss ceiling for every failure above them.

**Closed by:** a mainnet payout receipt showing sender-supplied energy, a fee set from a dated mainnet measurement, and mainnet caps with a written rationale naming the worst case each one bounds.

## Chain and validators

**Blocker.** Consensus parameters, including the network id and the testnet flag, are committed into the genesis hash and compared by peers at handshake. Mainnet is therefore a new genesis, not a configuration change, and it must pre-mint nothing, exactly as the current chain does. See [CLT Economics](/clutch-node/clt-economics).

Aura is an authority round-robin, so the validator set is permissioned by construction. Mainnet needs authorities that do not share an operator or a failure domain, each with its own key.

**Closed by:** reviewed and recorded genesis parameters, every node reporting the same genesis hash, block production observed continuing with one authority stopped, and a key rotation procedure rehearsed on a throwaway network.

## Durability and recovery

**Blocker.** The treasury ledger is the off-chain half of every deposit and redemption. The chain records the mint and the burn; it does not record which off-chain payment a mint answered. Losing that ledger means losing the ability to honour redemptions, so it needs the same seriousness as the keys.

**Closed by:** encrypted off-host backups on a schedule, and a restore performed into a clean environment with [reconciliation](/clutch-treasury/reserves-and-reconciliation) green against it. The restore closes this, not the existence of a backup job. Reconciliation itself runs on a schedule and alerts a human, with the alert route tested by forcing a failure.

## Abuse controls

**Required.** Anyone can create a keypair, so every authenticated endpoint is effectively public. Rate limits belong on those endpoints and on token issuance before a public launch. Deposit addresses are permanent and polled on a rotation, so the relationship between how many exist and worst-case detection latency needs a measured ceiling rather than a discovered one. See [Deposits](/clutch-treasury/deposits) for how polling works.

**Closed by:** limits recorded and shown to hold under load, and a documented ceiling on address growth.

## Client-side key handling

**Blocker for any app holding real funds.** This is the item most likely to affect you today.

The reference demo app generates or imports keys in the browser and stores them in plaintext `localStorage`. That is a deliberate choice for a demo on a valueless testnet, and it is not a wallet. Do not put real funds behind it, and do not carry that pattern into an app that will. The SDK's design does not require it: keys never leave the client, so a real key boundary can be substituted without changing how transactions are built or signed.

**Closed by:** the reference app moving to a real key boundary such as a hardware wallet, an OS keychain, or an external signer, or being presented unambiguously as a demo that is not a place to hold value.

## Market operations

These decide whether a real ride market is usable. They do not endanger the reserve.

**Dispute resolution — blocker for a public launch.** Cancellations are on-chain, but there is no arbitration when two parties disagree, and no no-show or fraud handling. Passengers also give up card-issuer chargebacks by signing payment directly, which is a fair trade for instant settlement on a testnet and a serious gap with real money: the passenger would have no recourse at all. A dispute mechanism has to exist, and the passenger's recourse has to be stated plainly before they pay.

**Reputation — required.** No driver or rider scoring exists, so nothing distinguishes a first-time counterparty from a repeatedly bad one.

**Matching — recommended.** Matching is simple, with no surge, pricing engine, or geospatial optimisation. This becomes an operational problem before it becomes a technical one, so the volume at which it needs work should be chosen rather than discovered.

## External review

**Blocker.** No external security audit has been done. The areas that most need outside eyes are the signing and encoding path, the four-eyes mint flow, the bounds on the payout endpoint, and the reconciliation arithmetic.

Test depth is uneven and follows the money, which is the right priority but leaves gaps: coverage is deepest in the treasury and thinnest in the Hub API, which sits on the path every user takes.

**Closed by:** an audit report with every critical and high finding fixed or accepted in writing, and failure-branch tests on the mint, burn, sweep, and payout paths, including the ambiguous-payout branch that deliberately stops and pages a human rather than retrying.

## Regulatory review

**Blocker.** A fully-reserved token that is redeemable for USDT and issued by an identifiable operator is money transmission or e-money in most jurisdictions, with registration, customer due diligence, safeguarding, and reporting consequences. An honest reserve model does not exempt it. Regulatory review, and whatever that review requires, precedes any real-funds deployment.

## What already holds

Stated so the sound parts are not assumed provisional. These were designed for this and are in place today:

- **The deposit mnemonic exists in one service.** The service that hands out deposit addresses holds only an extended public key, which derives receive addresses and cannot spend. Owning it does not move a deposit.
- **The sweep endpoint takes an address index and nothing else** — no destination, amount, or contract — so it cannot be turned into a second payout path.
- **Reserve custody is unreachable from code**, which is why payouts come from a bounded float.
- **Redemptions are bounded twice, in services that do not share the value.**
- **Ambiguous payouts stop rather than retry.** Only a reply proving nothing was broadcast returns a redemption to the queue; anything else pages a human. That accepts a stuck redemption to avoid a double payment.
- **Minting has four-eyes approval, a per-transaction cap, a daily cap, and a manual halt.**
- **Genesis pre-mints nothing.** Every CLT that exists was minted against a verified deposit.
- **Keys never leave the client for ride transactions.** The Hub forwards signed transactions and cannot alter one without invalidating the signature, and the SDK can verify a hub-built transaction against what the app asked for before signing it. See [Signing and Encoding](/reference/signing-and-encoding).

## Where help lands

Several of these are genuinely open problems rather than known work someone is already doing, and they are the most interesting parts of the system. Dispute resolution and reputation are design problems first, and the design is not settled. Test depth on the Hub API path is contributable today. So is review of the signing and encoding path, which is fully specified and does not require access to anything.

The [discussions](https://github.com/orgs/clutchprotocol/discussions) are open, and the [FAQ](/reference/faq) covers what is shipped versus planned.

## What this page is not

It is not a date. The items are ordered by dependency, not by schedule, and no mainnet date will appear here until the gate above is closed. It is also not exhaustive about internal operational work: the checklist this page derives from tracks infrastructure and process items that are not useful to publish.
