---
sidebar_position: 5
---

# Operating the Treasury

[Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) describes four-eyes approval, the mint caps, and the breaker that halts minting on a reconciliation mismatch. None of those pages say how an operator actually exercises any of them. This page does: dispatch-gated GitHub Actions workflows, defined in `clutch-deploy`, that each SSH to the deployment host and run one narrow script, and each require a typed word before they do anything at all.

## Stage or mainnet

The treasury tools work on both stacks. Each has a `chain` choice, `stage` by default. On `mainnet` the typed word gets ` mainnet` added to it (`approve mainnet` instead of `approve`), so a run meant for the testnet cannot touch real money by accident. Workflow run logs are public, so on mainnet the mint tools shorten a user's address in what they print. An input you type, such as the beneficiary of a manual mint, is shown on the run page whatever the script does.

## The workflows

| Workflow | What it does | Confirmation | Moves money |
|----------|---------------|----------------|--------------|
| `mint-intent-create.yml` | Records a mint intent — beneficiary, amount, and a reason — for a manual correction. Ordinary deposits never come through here; the orchestrator creates those intents itself from on-chain evidence. | `create` | No |
| `mint-intent-approve.yml` | Approves a mint intent from a **different** identity than whoever created it, and submits the `Mint` — the outbox re-checks caps and node sync immediately before signing, so approval alone is not authorization to mint. It also takes an intent parked in `needs_manual`, which is where a deposit over the per-transaction cap waits. | `approve` | Yes |
| `set-mint-caps.yml` | Changes the per-transaction and daily mint caps, with a reason recorded in the log. To credit a deposit over the cap: raise the cap, approve the intent, put the cap back. | `set` | No — changes a limit, not a balance |
| `halt-minting.yml` | Sets the breaker by hand, so no new CLT is minted until a human clears it. The control to reach for when you suspect rather than know: deposits are still recorded and the reserve stays correct. It does not stop payouts. | `halt` | No |
| `resume-minting.yml` | Clears the minting breaker. Refuses to run while the latest reconciliation is still a mismatch. | `resume` | No |
| `redrive-mint.yml` | Puts a mint stuck in `submitted` back in the outbox queue. It cannot mint twice: the chain refuses a second mint with the same reference. The treasury now also re-queues a submission that has gone unconfirmed for ten minutes by itself, so this is for the cases that needs a person. | `redrive` | Yes, at most once |
| `reverse-mint.yml` | Records that a mint the ledger believed happened no longer exists on chain — a node lost its database, say — bringing recorded liability back in line with what the chain actually shows. Touches the ledger only: no chain state changes, no USDT moves. | `reverse` | No |
| `close-repaid-deposit.yml` | Closes a deposit left in `needs_manual` whose depositor was already repaid by a separate mint. Refuses unless such a credited mint exists, so it cannot make an unpaid deposit look paid. | `close` | No |
| `activate-float.yml` | Activates the GasFree payout float with its first transfer. Redemptions are refused until this has run. It wants a surplus of at least 4.00 USDT over what users are owed, because the activation costs about 3 USDT. | `activate` | Yes |
| `set-gasfree-settings.yml` | Writes the GasFree block and the pilot limits into the host's env file. Takes a `network` choice rather than `chain`. | `gasfree` | No |
| `sweep-address.yml` | Sweeps one deposit address by hand, via `tron-signer`'s index-only sweep endpoint. Stage only, because its log prints the address you type. | `sweep` | Yes |
| `fund-float.yml` | Moves USDT into the payout float on the TRX rail. Stage only. | `fund` | Yes |
| `provision-treasury-secrets.yml` | Fills in whichever treasury secrets are missing from the host's `.env` or `.env.mainnet`. | `provision` | No |
| `backup-treasury-db.yml` | Dumps and encrypts both treasury databases, for both chains, and sends them off the host. Runs nightly. | None | No |
| `rehearse-restore.yml` | Restores a backup into a throwaway database and reconciles it, without starting anything that could move money. | `rehearse` | No |
| `set-pilot-allowlist.yml` | Writes which accounts may use the mainnet orchestrator, from a repository secret, because run inputs are public. | `pilot mainnet` | No |
| `inspect-stage.yml` | Read-only probe of the running stacks — nginx config, containers, git state, both treasuries, sweeper, chain heights, balances, energy. | None — every command it runs is read-only, so there is nothing to confirm | No |
| `deploy-stage.yml` | Deploys the stage compose stack, at the image tags pinned in `clutch-deploy`. Carries a `reset_chain` checkbox, unticked by default, for the separate and rarely-needed case of wiping chain and database state entirely. | None — `reset_chain` is a checkbox, not a typed word | No |

The mainnet stack has its own workflows for starting and upgrading it (`mainnet-start.yml`, `mainnet-treasury-up.yml`, `mainnet-app-up.yml`, `mainnet-reset-chain.yml` and others). The mainnet chain reset refuses for good once any CLT has been minted on that chain.

### Create and approve are separate acts

`create` only records an intent and a reason; it mints nothing. `approve` is the half that actually creates CLT. They are deliberately two dispatches rather than one, because the treasury enforces that `created_by` and `approved_by` come from different identities — the database rejects a row where they match. What is not enforced is that two different *people* ran the two workflows: both tokens live in the same host `.env`, so anyone who can dispatch one can dispatch the other. The Actions log, not the database, is the actual record of who did what.

### `provision-treasury-secrets` never overwrites

It only ever writes a variable that is completely absent from the host's `.env`. Run it against a fully-provisioned host and it does nothing — it is not a way to rotate `DEPOSIT_MNEMONIC` or anything else already set. That is deliberate: replacing the deposit mnemonic would derive an entirely different set of addresses, permanently orphaning every address already handed out to a depositor, while those addresses carry on receiving USDT nothing can any longer sweep.

### The `sweep-address` gap

The automatic sweeper only collects a deposit address once its mint intent has reached `credited` or `submitted`. An intent that ends `failed` strands real USDT at a real address: nothing collects it automatically, and reconciliation stops counting it, because a `failed` intent falls outside the reserve sum. The money is not gone — it is sitting exactly where it was paid — but the bookkeeping has let go of it. `sweep-address.yml` is the way back: it hands `tron-signer` a derivation index and nothing else, the same shape the automatic sweeper itself uses, so running this by hand still cannot redirect where the money goes. It does not credit anyone CLT — sweeping puts the money back where the reserve counts it; paying a depositor what a failed mint owed them is a separate correction through `mint-intent-create.yml`, and that correction can only pass the reserve check once the sweep has landed.

### A fresh address has to be funded before it can be swept (TRX rail only)

This applies only to the TRX rail. On the GasFree rail, which the stage and the mainnet pilot run, a sweep is a relay permit whose fee comes out of the USDT, and nothing needs TRX.

A TRC-20 transfer costs TRX for energy, and a freshly derived deposit address holds none — receiving USDT does not create a TRX balance. The first sweep of a brand-new address can only fund it from `tron-signer`'s own fee account; collection happens on a later pass, once that funding transaction has confirmed. An operator who runs `sweep-address.yml` and sees `funded` has not failed — that is the expected result of sweeping an address for the first time. Run it again once the funding has had time to confirm, rather than treating `funded` as an error.

## Related

- [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation) — the caps and breaker these workflows operate
- [Deposits](/clutch-treasury/deposits) — the status a deposit needs to reach before it can be swept
- [Treasury Stack](/deployment/treasury-stack) — the services and environment these workflows act on
- [Overview](/clutch-treasury/overview) — the three services and what each may do
