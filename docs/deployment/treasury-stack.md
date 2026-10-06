---
sidebar_position: 4
---

# Treasury Stack

`docker-compose.treasury.yml` in `clutch-deploy` adds three services on top of the base stack: `treasury-service`, `tron-signer`, and `payment-orchestrator` — the same three described in [Clutch Treasury Overview](/clutch-treasury/overview). This page is about running them: which ports exist, which network they sit on, and which environment variables each one needs. What they actually decide once they're up is the rest of the Clutch Treasury section, especially [Operating the Treasury](/clutch-treasury/operations).

## Bringing it up

The base stack has to be running first ([Clutch Deploy](/deployment/clutch-deploy)) — the treasury file is an overlay, not a replacement for anything in it. Compose it last, after whichever environment overlay you're already using:

```powershell
docker compose -p clutch-dev -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.treasury.yml up -d --build
```

It stays a separate file rather than folding into the base compose so a deployment with no reason to run the reserve side never has to, and so local and a real deployment can each opt in on their own.

## Services and reachability

| Service | Published port | Reachable from |
|---------|-----------------|-----------------|
| `payment-orchestrator` | `8091` locally; none on stage or mainnet | The one service real users are meant to call. Locally the demo app calls `localhost:8091`. On stage, `docker-compose.stage.treasury.yml` removes the port and nginx proxies `/payment/` on the app's own origin to it, so the browser never reaches it directly. |
| `treasury-service` | None — by design | Other containers only: `payment-orchestrator` over `treasury-network`. It also reaches *out* to a node's WebSocket RPC over `clutch-network`, but nothing calls in on that network. |
| `tron-signer` | None — by design, and the most sensitive service in the stack | `treasury-service` only, over `treasury-network`. |
| `treasury-postgres` / `orchestrator-postgres` | None, and none is possible | Nothing outside `treasury-network` can reach either database — see below. |

`treasury-service` and `tron-signer` having no published port is not an oversight to fix later; it is the point of the file. The only service meant to answer a request from outside the stack is `payment-orchestrator`, and it holds no key that can move anything (see [Overview](/clutch-treasury/overview) for what that guarantees).

## The internal network

Both Postgres instances live on `treasury-network`, declared `internal: true` and nowhere else. That flag means a container on it has no route to, or from, the outside world except through another network it also happens to join — so neither database is reachable from the host or the internet, regardless of any port-mapping mistake made anywhere else in the stack.

The treasury file also gives `clutch-explorer-backend` one setting, `APP_TREASURY_PUBLIC_RECONCILIATION_URL=http://treasury-service:8090/public/reconciliation`, which is what switches on the explorer's [reserve endpoint](/clutch-explorer/api-reference#reserve). It is set here rather than in the base file so that a stack with no treasury shows no reserve section, instead of a broken one. `/public/reconciliation` carries only the figures a holder needs and nothing operational.

`treasury-service`, `tron-signer`, and `payment-orchestrator` all join `treasury-network` too, each for a specific reason: it's how `treasury-service` and `payment-orchestrator` reach their own Postgres, how `payment-orchestrator` calls the treasury's internal API, and how `treasury-service` reaches `tron-signer`. Two of those three also join the base stack's `clutch-network`, for reasons specific to each — `treasury-service` needs it only to read a node's WebSocket RPC when judging chain state, and `tron-signer` needs it only for outbound TronGrid calls when it signs and broadcasts a sweep or a payout. Being on an `internal: true` network alone would give `tron-signer` no route out at all. `payment-orchestrator` joins `clutch-network` for the opposite reason: it is the one service meant to be reached *from* it.

## Two Postgres instances, not one

`treasury-service` and `payment-orchestrator` each get their own database rather than sharing one. That is not caution for its own sake: sqlx's migration-tracking table has no configurable name, so two independently-migrating services sharing a database would corrupt each other's migration history. It mirrors what the test suite already does per crate.

## Environment variables

`clutch-deploy`'s `.env.example` documents only the GasFree block below and the alerting values. Every other name here has to come from this page or the compose file itself. "Required" means the container refuses to start without it; "defaulted" means it runs on a built-in value if `.env` doesn't set one.

### `treasury-service`

| Variable | | What it's for |
|----------|--|----------------|
| `MINT_AUTHORITY_SECRET` | Required | The Clutch-chain key this service mints with. No placeholder — a missing value fails the service at startup rather than risking a silent wrong-key mint. |
| `TREASURY_INITIATOR_TOKEN` | Required | Bearer token for creating a mint intent. Shared with `payment-orchestrator`, which uses it to request ordinary deposit mints. |
| `TREASURY_APPROVER_TOKEN` | Required | Bearer token for approving a mint intent — the half that actually mints (see [Operating the Treasury](/clutch-treasury/operations)). Never given to `payment-orchestrator`. |
| `TREASURY_READONLY_TOKEN` | Required | Bearer token for read-only treasury queries. Shared with `payment-orchestrator`. |
| `SIGNER_TOKEN` | Required | Presented to `tron-signer`. Must be the same value set there. |
| `TREASURY_POSTGRES_PASSWORD` | Required | Credential for this service's own Postgres. |
| `TREASURY_LOG_LEVEL` | Defaulted | Log verbosity. |
| `CHAIN_ID` | Defaulted | The Clutch chain this service mints against. |
| `TRONGRID_URL` | Defaulted | Which Tron network this service reads for deposit verification and reconciliation. |
| `TRONGRID_API_KEY` | Defaulted, empty | Raises TronGrid's rate limit; works unkeyed but throttles hard. |
| `CUSTODY_TRON_ADDRESS` | Defaulted, empty here — required on `tron-signer` | The reserve address this service reads a balance from during reconciliation. |
| `USDT_CONTRACT` | Defaulted | Which TRC-20 contract counts as USDT here — must name the same one `TRONGRID_URL` actually serves. |
| `PER_TX_MINT_CAP_CLT`, `DAILY_MINT_CAP_CLT` | Defaulted | The mint gate's per-transaction and rolling 24-hour caps — see [Reserves and Reconciliation](/clutch-treasury/reserves-and-reconciliation#the-mint-gate). Changeable at runtime; see [Operating the Treasury](/clutch-treasury/operations). |
| `SWEEP_THRESHOLD_USDT`, `SWEEP_MAX_AGE_HOURS` | Defaulted | When a deposit address becomes eligible for the automatic sweep. |
| `SWEEP_MIN_USDT` | Defaulted, $5 | The floor under the age rule: a balance below it is left where it is, because sweeping it would cost more than it recovers. It is still counted in the reserve. |
| `PAYOUT_FLOAT_ADDRESS` | Defaulted | The payout float's address, so reconciliation counts it as reserve. Meant to be read off `tron-signer`, not typed by hand. |
| `DAILY_PAYOUT_CAP_CLT` | Defaulted | Rolling 24-hour redemption ceiling in CLT — see [Redemptions](/clutch-treasury/redemptions#caps). |
| `REDEMPTION_FEE_USDT` | Defaulted | Taken off the USDT leg of every redemption, in micro-USDT. It must stay below the orchestrator's `MIN_REDEMPTION_CLT`. |
| `RECONCILIATION_INTERVAL_SECS` | Defaulted, 3600 | How often reconciliation runs. The staleness alert expects a run within two hours. |

### `tron-signer`

| Variable | | What it's for |
|----------|--|----------------|
| `DEPOSIT_MNEMONIC` | Required | The only copy of the wallet mnemonic anywhere in the stack. No placeholder fallback — a stand-in value here would be a valid but *different* wallet, and the first symptom would be deposits arriving somewhere nothing can sweep. |
| `SIGNER_TOKEN` | Required | Must match `treasury-service`'s copy. |
| `CUSTODY_TRON_ADDRESS` | Required | Where sweeps go on the TRX rail. Not a request parameter — this is the entire reason a compromised caller cannot redirect a sweep. |
| `PAYOUT_FLOAT_TARGET_USDT` | GasFree rail | Sweeps pay into the GasFree float until it holds this much, then into custody. Set above anything deposits can reach, every sweep goes to the float and custody stays empty, which is how the mainnet pilot runs, and the testnet's settings since 2026-10-05 (see [Clutch Treasury Overview](/clutch-treasury/overview#testnet-and-mainnet-posture)). |
| `SIGNER_LOG_LEVEL` | Defaulted | Log verbosity. |
| `DEPOSIT_PASSPHRASE` | Defaulted, empty | Optional BIP-39 passphrase layered on top of the mnemonic. |
| `TRONGRID_URL`, `TRONGRID_API_KEY`, `USDT_CONTRACT` | Defaulted | Same meaning as on `treasury-service` — must agree with it. |
| `PER_TX_PAYOUT_CAP_USDT` | Defaulted | The most a single redemption payout may move, in micro-USDT. Refuses to start on a non-positive value — a cap that silently defaults is a cap nobody chose. See [Redemptions](/clutch-treasury/redemptions#caps). |

### `payment-orchestrator`

| Variable | | What it's for |
|----------|--|----------------|
| `ORCHESTRATOR_POSTGRES_PASSWORD` | Required | Credential for this service's own Postgres. |
| `TREASURY_INITIATOR_TOKEN`, `TREASURY_READONLY_TOKEN` | Required | The same values set on `treasury-service` — how the orchestrator asks it to mint against a confirmed deposit, and reads status back. |
| `DEPOSIT_ACCOUNT_XPUB` | Required | The public material every deposit address is derived from. No placeholder — a wrong value derives addresses nobody holds the matching key for, and any deposit paid to one would be unrecoverable. Meant to be read off `tron-signer`, not typed by hand. |
| `ORCHESTRATOR_LOG_LEVEL` | Defaulted | Log verbosity. |
| `JWT_SECRET` | Defaulted | Must be the exact secret the Hub API signs user tokens with — see [Deposits — Authentication](/clutch-treasury/deposits#authentication). |
| `ALLOWED_ORIGINS` | Defaulted | CORS allowlist for browsers calling this service directly. |
| `CUSTODY_TRON_ADDRESS` | Defaulted, empty | Where this service tells `tron-signer` to sweep into — the same name `tron-signer` requires above. |
| `TRONGRID_URL`, `TRONGRID_API_KEY`, `USDT_CONTRACT` | Defaulted | Same meaning as on `treasury-service` — must agree with both other services. |
| `MIN_REDEMPTION_CLT`, `MAX_REDEMPTION_CLT` | Defaulted | The smallest and largest redemption a user may ask for. The maximum must never exceed `tron-signer`'s `PER_TX_PAYOUT_CAP_USDT`, or a user could burn CLT for a payout the signer will refuse. |
| `DEPOSIT_HOT_WINDOW_HOURS` | Defaulted | How long an address stays on the fast poll tier after the deposit panel is opened — see [Deposits](/clutch-treasury/deposits#detection-hot-and-cold). |
| `PERMANENT_DEPOSIT_ADDRESSES_ENABLED` | Defaulted, on | Rollout gate for issuing *new* deposit addresses. Off does not un-issue the ones already handed out. |

### The GasFree rail

`TRANSFER_RAIL` picks how USDT moves out of a deposit address and out to a redeemer: `trx` (the default here) pays for energy in TRX from the signer's fee account, and `gasfree` moves it by a relay permit whose fee is taken from the USDT, so no TRX is needed. The stage and the mainnet pilot run `gasfree`. See [Deposits](/clutch-treasury/deposits) for what a user sees.

The same `.env` names feed all three services, so they cannot disagree: `TRANSFER_RAIL`, `GASFREE_NETWORK` (blank switches the rail off), `GASFREE_ACTIVATE_FEE_MAX_USDT`, `GASFREE_TRANSFER_FEE_MAX_USDT`, `MIN_DEPOSIT_USDT`, `GASFREE_EXPECTED_IMPLEMENTATION` and `GASFREE_EXPECTED_CONTROLLER_IMPLEMENTATION`. `tron-signer` alone also takes the relay's `GASFREE_API_URL`, `GASFREE_API_KEY`, `GASFREE_API_SECRET` and `GASFREE_SERVICE_PROVIDER`. The key and secret are relay credentials: they cannot move money, because only a permit `tron-signer` signs can. `check-cap-invariants.sh` refuses a deploy where the set is incomplete.

The GasFree float has to be activated once before it can pay a redemption, and the treasury refuses to create a redemption until it has been. That activation costs about 3 USDT, paid from the float itself.

### The mainnet treasury

The mainnet pilot's treasury does not use this file. `docker-compose.mainnet.treasury.yml` is a complete file of its own, run as compose project `clutch-main-treasury` with its own env file, `.env.mainnet`, and its own image pins, so moving the stage treasury never moves mainnet. Its services are named `mainnet-treasury-service`, `mainnet-tron-signer` and `mainnet-payment-orchestrator`, so that none of them can answer for a stage service on a shared network. It publishes no port: `/payment/` on `app.clutchprotocol.io` proxies to the orchestrator. Two settings exist only there:

- `PILOT_ALLOWED_ADDRESSES` (required) lists the accounts the orchestrator serves, comma-separated, or `*` for everyone. Every other account gets a 403. Mainnet has been open to everyone since 2026-10-05.
- `APP_SIGNER_KIND=env` with `MINT_AUTHORITY_SECRET`: the mint key is a plain secret in `.env.mainnet`, made once on the host. At start the treasury compares its address with the chain's `mint_authority` and halts minting if they differ.

It is started only by the "Mainnet — start the treasury" workflow, which checks the env file line by line (permissions, mainnet TronGrid and USDT contract, no secret shared with stage, the mint key matching the chain) before it starts anything. CI checks the file against the stage one on every pull request.

`APP_REDEMPTIONS_ENABLED` isn't in the tables above because it isn't sourced from `.env` at all — the compose file sets it to `true` directly. Changing it means editing `docker-compose.treasury.yml` itself, not `.env`, which is deliberate: a switch that turns an irreversible burn into a live user-facing route should require a reviewed commit, not a line someone adds to a host file at 2am. See [Redemptions](/clutch-treasury/redemptions).

## Related

- [Clutch Treasury Overview](/clutch-treasury/overview) — the three services, and what each may and may not do
- [Operating the Treasury](/clutch-treasury/operations) — the workflows that exercise mint approval, caps, and sweeping
- [Clutch Deploy](/deployment/clutch-deploy) — the base stack this overlays
- [Security](/reference/security) — key management across the whole stack
