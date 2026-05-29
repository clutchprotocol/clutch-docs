---
sidebar_position: 1
---

# Introduction

**Clutch Protocol** is a decentralized ride-sharing blockchain that cuts platform fees from 15–25% to 5–8%, enables instant payouts, and targets transparent on-chain ride operations. Built on a custom non-EVM blockchain.

## Key Features

- **Ultra-low fees** — 5–8% vs 15–25% on traditional platforms
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
| Demo app | https://demo.clutchprotocol.io |
| Stage demo | https://app-stage.clutchprotocol.io |
| npm SDK | https://www.npmjs.com/package/clutch-hub-sdk-js |
| Docker packages | [Docker images](/reference/docker-images) · [GHCR org](https://github.com/orgs/clutchprotocol/packages) · [Docker Hub](https://hub.docker.com/u/9194010019) |

## Fee Distribution

For a $10 ride (target model):

- **Driver**: $9.00 (90%)
- **Network nodes**: $0.50 (5%)
- **Development fund**: $0.50 (5%)

Referrer fees on ride payments are configured on the node (default 2% each for request/offer referrers).

## Quick Links

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
