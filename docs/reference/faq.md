---
sidebar_position: 3
---

# FAQ

## General

**What is Clutch Protocol?**  
A decentralized ride-sharing blockchain with on-chain ride lifecycle, client-side signing, and low platform fees.

**Is it production-ready?**  
No. Alpha/experimental. APIs may change without notice.

**Is there a DAO / governance?**  
Described on the marketing site as roadmap. Not implemented in the current codebase.

## Deployment

**Why is /health not working?**  
Ensure `ws_addr = "0.0.0.0:3000"` in API config and port 3000 is mapped in Docker.

**Port conflicts?**  
Grafana uses 3030 to avoid clash with API on 3000. Explorer frontend uses 5174 (demo uses 5173).

**How do I reset the chain?**  
`docker compose down -v && docker compose up -d` in clutch-deploy.

## Authentication

**How do I authenticate?**  
Call GraphQL `generateToken(publicKey)`. No username/password. The SDK does this automatically.

**Do subscriptions need auth?**  
Public list subscriptions work without JWT. `accountBalance` and mutations require JWT.

## SDK

**Which npm package?**  
[`clutch-hub-sdk-js`](https://www.npmjs.com/package/clutch-hub-sdk-js)

**How do I get a nonce?**  
The API fetches it from the node when you call `createUnsigned*`. You do not call the node directly.

**submitSignedTransaction vs submitTransaction?**  
Use `submitTransaction(rawTransaction)` — the old method name is deprecated.

## Faucet

**Faucet returns "disabled"?**  
Set `faucet_enabled = true` and configure `faucet_private_key` with a funded account.

**How much CLT per request?**  
Default 1000 CLT (`faucet_amount_clt` in config).

## Explorer

**Hub API vs Explorer?**  
Hub API is for building apps (GraphQL, write txs). Explorer is for browsing chain history (REST, read-only).

**Why is my transaction not in the explorer yet?**  
Indexer polls every ~4 seconds. Wait and refresh.

## Stage URLs

| Service | URL |
|---------|-----|
| Demo | https://app-stage.clutchprotocol.io |
| API | https://api-stage.clutchprotocol.io |
| Node 1 | wss://node1-stage.clutchprotocol.io/ws |

## Docker images

- Node: `ghcr.io/clutchprotocol/clutch-node:latest`
- API: `ghcr.io/clutchprotocol/clutch-hub-api:latest`
- Demo: `ghcr.io/clutchprotocol/clutch-hub-demo-app:latest`
- Explorer: `ghcr.io/clutchprotocol/clutch-explorer-backend:latest`, `ghcr.io/clutchprotocol/clutch-explorer-frontend:latest`

## Documentation

Full docs: https://docs.clutchprotocol.io
