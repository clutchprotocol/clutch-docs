---
sidebar_position: 1
---

# Introduction

**Clutch Protocol** is a decentralized ride-sharing blockchain with on-chain ride lifecycle, client-side signing, and instant CLT payouts to drivers. Built on a custom non-EVM blockchain, and the settlement layer for CLT: a **fully-reserved, redeemable token** pegged **1 USD = 1,000,000 CLT** — every CLT in circulation is backed 1:1 by off-chain reserve.

## Key Features

- **Fully-reserved CLT** — 1 USD = 1,000,000 CLT (CLT is an integer micro-dollar, no decimals). The only two operations that change total supply are the authority-gated `Mint` and the permissionless `Burn` — see [CLT Economics](/clutch-node/clt-economics)
- **Driver-first payments** — Drivers receive most of each fare; optional referrer fees up to 400 bps (4%; default 200+200 bps) on `RidePay`
- **Instant payouts** — Drivers receive CLT as passengers pay via on-chain transactions
- **Transparent & secure** — On-chain transactions with cryptographic security, chain-bound signatures, and full auditability
- **Developer-friendly** — JavaScript SDK, GraphQL API, Docker deployment, block explorer
- **Decentralized** — Aura consensus with distributed validator nodes, compensated by a flat per-transaction fee rather than block rewards

:::info Governance
Community governance (DAO) is on the roadmap and described on the [marketing site](https://clutchprotocol.io). It is not yet implemented in the current codebase.
:::

## Architecture Overview

| Component | Description |
|-----------|-------------|
| **Clutch Node** | Blockchain core with Aura consensus, custom transaction format |
| **Clutch Treasury** | Fully-reserved USDT deposits and redemptions, split across three services so none can both decide and move funds |
| **Clutch Hub API** | Application-to-node bridge (GraphQL) |
| **Clutch Hub SDK** | JavaScript/TypeScript SDK for client-side signing |
| **Clutch Explorer** | Block indexer, REST API, and web UI |
| **Clutch Deploy** | Full-stack Docker Compose deployment |
| **Demo App** | Reference React app for passenger/driver ride flows |

## Live links

| Resource | URL |
|----------|-----|
| Documentation | https://docs.clutchprotocol.io |
| Stage demo app | https://app-stage.clutchprotocol.io |
| npm SDK | https://www.npmjs.com/package/clutch-hub-sdk-js |
| Docker packages | [Docker images](/reference/docker-images) · [GHCR org](https://github.com/orgs/clutchprotocol/packages) · [Docker Hub](https://hub.docker.com/u/9194010019) |

## CLT economics

CLT is fully reserved: **1 USD = 1,000,000 CLT**, and every CLT is backed 1:1 by off-chain reserve. Ride payments and validator compensation are separate, and neither one changes total supply — only `Mint` (authority-gated, on-ramp) and `Burn` (permissionless, redemption) do that.

| Layer | Mechanism | Default |
|-------|-----------|---------|
| **RidePay** | Referrer fees + driver remainder | 200 bps (2%) request + 200 bps (2%) offer per payment |
| **Every transaction** | Flat fee to the block author | `tx_fee` = 1000 CLT ($0.001) |

**Example:** a $5.00 fare (5,000,000 CLT), one full `RidePay`, both referrers set → request referrer 100,000 CLT ($0.10), offer referrer 100,000 CLT ($0.10), driver 4,800,000 CLT ($4.80).

Validators are **not** paid from ride fares or block rewards — block rewards don't exist, because minting unbacked CLT to pay them would break the 1:1 reserve invariant. They earn the flat `tx_fee` paid by (almost) every transaction instead.

Full details: [CLT Economics](/clutch-node/clt-economics)

## Quick Links

- [Build apps and earn CLT](/getting-started/app-developer-incentives) — Referrer fees for app developers
- [Quick Start](/getting-started/quickstart) — Run locally in minutes
- [Passenger–driver flow](/getting-started/ride-lifecycle#complete-passengerdriver-flow) — Full sequence diagram
- [Ride Lifecycle](/getting-started/ride-lifecycle) — End-to-end tutorial
- [Architecture](/getting-started/architecture) — System design
- [Docker images](/reference/docker-images) — GHCR and Docker Hub packages
- [Clutch Hub API](/clutch-hub-api/overview) — GraphQL reference
- [SDK](/clutch-hub-sdk-js/overview) — JavaScript/TypeScript integration
- [Explorer](/clutch-explorer/overview) — Block explorer
- [Clutch Treasury](/clutch-treasury/overview) — Deposits, reserves, and redemptions behind the peg
- [Demo App](/demo-app/overview) — Reference application

## Status

:::warning Alpha Software
Clutch Protocol is in active development. APIs may change without notice. Use at your own risk.
:::
