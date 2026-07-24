---
sidebar_position: 1
---

# Introduction

**Clutch Protocol** is a decentralized ride-sharing blockchain with on-chain ride lifecycle, client-side signing, and instant CLT payouts to drivers. Built on a custom non-EVM blockchain.

## Key Features

- **Driver-first payments** — Drivers receive most of each fare; optional referrer fees up to 4% (default 2%+2%) on `RidePay`
- **Instant payouts** — Drivers receive CLT as passengers pay via on-chain transactions
- **Transparent & secure** — On-chain transactions with cryptographic security and full auditability
- **Developer-friendly** — JavaScript SDK, GraphQL API, Docker deployment, block explorer
- **Decentralized** — Aura consensus with distributed validator nodes

:::info Governance
Community governance (DAO) is on the roadmap and described on the [marketing site](https://clutchprotocol.io). It is not yet implemented in the current codebase.
:::

## Architecture Overview

| Component | Description |
|-----------|-------------|
| **Clutch Node** | Blockchain core with Aura consensus, custom transaction format |
| **Clutch Hub API** | Application-to-node bridge (GraphQL + faucet) |
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

Ride payments and validator rewards are separate:

| Layer | Mechanism | Default |
|-------|-----------|---------|
| **RidePay** | Referrer fees + driver remainder | 2% request + 2% offer per payment |
| **Blocks** | Fixed reward to block author | 50 CLT per block |

**Example:** 10 CLT fare, one full `RidePay`, both referrers set → request referrer 1 CLT, offer referrer 1 CLT, driver 8 CLT.

Validators are **not** paid from ride fares; they earn `block_reward_amount` when authoring blocks.

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
- [Demo App](/demo-app/overview) — Reference application

## Status

:::warning Alpha Software
Clutch Protocol is in active development. APIs may change without notice. Use at your own risk.
:::
