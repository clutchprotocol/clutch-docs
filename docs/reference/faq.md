---
sidebar_position: 3
---

# FAQ

## General

**What is Clutch Protocol?**  
A decentralized ride-sharing blockchain cutting fees to 5–8% and enabling instant payouts.

**Is it production-ready?**  
No. Alpha/experimental. APIs may change without notice.

## Deployment

**Why is /health not working?**  
Ensure `ws_addr = "0.0.0.0:3000"` in `config/api/default.toml` (API binds to 3000, matching Docker port mapping).

**Port conflicts?**  
Grafana uses 3030 to avoid clash with API on 3000.

## SDK

**Which npm package?**  
`clutch-hub-sdk-js`

**How to get nonce?**  
The API returns nonce as part of `createUnsignedRideRequest`. The SDK handles it internally.

## GitHub

**Docker images?**  
- Node: `ghcr.io/clutchprotocol/clutch-node:latest`  
- API: `9194010019/clutch-hub-api:latest` or `ghcr.io/clutchprotocol/clutch-hub-api:latest`
