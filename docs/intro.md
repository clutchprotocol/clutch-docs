---
sidebar_position: 1
---

# Introduction

**Clutch Protocol** is a decentralized ride-sharing blockchain that cuts platform fees from 15–25% to 5–8%, enables instant payouts, and empowers users through community governance. Built on a custom blockchain targeting the $100B+ transportation market.

## Key Features

- **Ultra-low fees** — 5–8% vs 15–25% on traditional platforms
- **Instant payouts** — Drivers receive payments immediately after ride completion
- **Transparent & secure** — On-chain transactions with cryptographic security and full auditability
- **Community governance** — DAO-driven decision making for platform changes
- **Developer-friendly** — SDKs, GraphQL API, Docker deployment
- **Decentralized** — No single point of failure with distributed nodes

## Architecture Overview

| Component | Description |
|-----------|-------------|
| **Clutch Node** | Blockchain core with Aura consensus, custom transaction format |
| **Clutch Hub API** | Application-to-node bridge (GraphQL, REST) |
| **Clutch Hub SDK** | JavaScript/TypeScript SDK for transaction signing and encoding |
| **Clutch Deploy** | Full-stack Docker Compose deployment |
| **Demo App** | Reference React app showcasing ride-sharing with the SDK |

## Fee Distribution

For a $10 ride:
- **Driver**: $9.00 (90%)
- **Network nodes**: $0.50 (5%)
- **Development fund**: $0.50 (5%)

## Quick Links

- [Quick Start](/getting-started/quickstart) — Run locally in minutes
- [Architecture](/getting-started/architecture) — System design
- [Clutch Node](/clutch-node/overview) — Blockchain configuration
- [Clutch Hub API](/clutch-hub-api/overview) — API reference
- [SDK](/clutch-hub-sdk-js/overview) — JavaScript/TypeScript integration
- [Demo App](/demo-app/overview) — Reference application

## Status

:::warning Alpha Software
Clutch Protocol is in active development. APIs may change without notice. Use at your own risk.
:::
