---
sidebar_position: 5
---

# Operating the Treasury

[Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) describes four-eyes approval, the mint caps, and the breaker that halts minting on a reconciliation mismatch. None of those pages say how an operator actually exercises any of them. This page does: nine dispatch-gated GitHub Actions workflows, defined in `clutch-deploy`, that each SSH to the deployment host and run one narrow script — and each require a typed word before they do anything at all.

## The workflows

| Workflow | What it does | Confirmation | Moves money |
|----------|---------------|----------------|--------------|
| `mint-intent-create.yml` | Records a mint intent — beneficiary, amount, and a reason — for a manual correction. Ordinary deposits never come through here; the orchestrator creates those intents itself from on-chain evidence. | `create` | No |
| `mint-intent-approve.yml` | Approves a mint intent from a **different** identity than whoever created it, and submits the `Mint` — the outbox re-checks caps and node sync immediately before signing, so approval alone is not authorization to mint. | `approve` | Yes |
| `set-mint-caps.yml` | Changes the per-transaction and daily mint caps, with a reason recorded in the log. | `set` | No — changes a limit, not a balance |
| `resume-minting.yml` | Clears the minting breaker after a reconciliation mismatch halted it. Refuses to run while the latest reconciliation is still a mismatch. | `resume` | No |
| `reverse-mint.yml` | Records that a mint the ledger believed happened no longer exists on chain — a node lost its database, say — bringing recorded liability back in line with what the chain actually shows. Touches the ledger only: no chain state changes, no USDT moves. | `reverse` | No |
| `sweep-address.yml` | Sweeps one deposit address into custody by hand, via `tron-signer`'s index-only sweep endpoint. | `sweep` | Yes |
| `provision-treasury-secrets.yml` | Fills in whichever treasury secrets are missing from the host's `.env`. | `provision` | No |
| `inspect-stage.yml` | Read-only probe of the running stack — nginx config, containers, git state, treasury, sweeper, chain heights, balances. | None — every command it runs is read-only, so there is nothing to confirm | No |
| `deploy-stage.yml` | Deploys the compose stack. Carries a `reset_chain` checkbox, unticked by default, for the separate and rarely-needed case of wiping chain and database state entirely. | None — `reset_chain` is a checkbox, not a typed word | No |

### Create and approve are separate acts

`create` only records an intent and a reason; it mints nothing. `approve` is the half that actually creates CLT. They are deliberately two dispatches rather than one, because the treasury enforces that `created_by` and `approved_by` come from different identities — the database rejects a row where they match. What is not enforced is that two different *people* ran the two workflows: both tokens live in the same host `.env`, so anyone who can dispatch one can dispatch the other. The Actions log, not the database, is the actual record of who did what.

### `provision-treasury-secrets` never overwrites

It only ever writes a variable that is completely absent from the host's `.env`. Run it against a fully-provisioned host and it does nothing — it is not a way to rotate `DEPOSIT_MNEMONIC` or anything else already set. That is deliberate: replacing the deposit mnemonic would derive an entirely different set of addresses, permanently orphaning every address already handed out to a depositor, while those addresses carry on receiving USDT nothing can any longer sweep.

### The `sweep-address` gap

The automatic sweeper only collects a deposit address once its mint intent has reached `credited` or `submitted`. An intent that ends `failed` strands real USDT at a real address: nothing collects it automatically, and reconciliation stops counting it, because a `failed` intent falls outside the reserve sum. The money is not gone — it is sitting exactly where it was paid — but the bookkeeping has let go of it. `sweep-address.yml` is the way back: it hands `tron-signer` a derivation index and nothing else, the same shape the automatic sweeper itself uses, so running this by hand still cannot redirect where the money goes. It does not credit anyone CLT — sweeping restores custody and the reserve; paying a depositor what a failed mint owed them is a separate correction through `mint-intent-create.yml`, and that correction can only pass the reserve check once the sweep has landed.

### A fresh address has to be funded before it can be swept

A TRC-20 transfer costs TRX for energy, and a freshly derived deposit address holds none — receiving USDT does not create a TRX balance. The first sweep of a brand-new address can only fund it from `tron-signer`'s own fee account; collection happens on a later pass, once that funding transaction has confirmed. An operator who runs `sweep-address.yml` and sees `funded` has not failed — that is the expected result of sweeping an address for the first time. Run it again once the funding has had time to confirm, rather than treating `funded` as an error.

## Related

- [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) — the caps and breaker these workflows operate
- [Deposits](/clutch-treasury/deposits) — the status a deposit needs to reach before it can be swept
- [Treasury Stack](/deployment/treasury-stack) — the services and environment these workflows act on
- [Overview](/clutch-treasury/overview) — the three services and what each may do
