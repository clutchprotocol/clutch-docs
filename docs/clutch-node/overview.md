---
sidebar_position: 1
---

# Clutch Node Overview

Clutch Node is the blockchain core of Clutch Protocol. It runs the consensus layer, stores blocks, and exposes WebSocket and metrics endpoints.

## Features

- **Aura consensus** — Block production and finality
- **Custom transaction format** — Optimized for ride-sharing (non-EVM)
- **Metrics** — Prometheus-compatible `/metrics` on ports 3001–3003
- **Multi-node** — Bootstrap and peer discovery via libp2p
- **Decentralized** — Eliminates intermediaries, direct user-to-user
- **Secure** — Blockchain-verified transactions

## Ports (per node)

| Port | Purpose |
|------|---------|
| 8081/8082/8083 | WebSocket (node1/node2/node3) |
| 4001/4002/4003 | libp2p |
| 3001/3002/3003 | Prometheus metrics |

## Source

[clutch-node](https://github.com/clutchprotocol/clutch-node) on GitHub.
