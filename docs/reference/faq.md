---
sidebar_position: 5
---

# FAQ

## General

**What is Clutch Protocol?**  
A decentralized ride-sharing blockchain with on-chain ride lifecycle, client-side signing, and CLT payments. CLT is a fully-reserved, redeemable token (1 USD = 1,000,000 CLT) — referrer fees on RidePay go to app builders, and validators are compensated by a flat per-transaction fee rather than block rewards.

**What is CLT and why does it have no decimals?**  
CLT is pegged 1 USD = 1,000,000 CLT, making CLT itself the smallest unit (a micro-dollar) — there's nothing smaller to express as a decimal. Every CLT in circulation is backed 1:1 by off-chain reserve; the only operations that change total supply are the authority-gated `Mint` and the permissionless `Burn`. See [CLT Economics](/clutch-node/clt-economics).

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
Call GraphQL `generateToken(publicKey, timestamp, signature)`, where `signature` is a secp256k1 signature over the challenge `clutch-auth:{chain_id}:{publicKey}:{timestamp}` proving you hold the private key. No username/password. The SDK does this automatically when given the private key and a `chainId` at construction.

**Do subscriptions need auth?**  
Public list subscriptions work without JWT. `accountBalance` and mutations require JWT.

## SDK

**Which npm package?**  
[`clutch-hub-sdk-js`](https://www.npmjs.com/package/clutch-hub-sdk-js)

**How do I get a nonce?**  
The API fetches it from the node when you call `createUnsigned*`. You do not call the node directly.

**submitSignedTransaction vs submitTransaction?**  
Use `submitTransaction(rawTransaction)` — the old method name is deprecated.

**Why is `fare`/`amount` a `bigint` now?**  
A `number` silently loses precision above `2^53`, which is a reachable CLT amount at this release's peg — not a theoretical edge case. Pass `5_000_000n`, not `5000000`, and format for display with `formatUsd()`.

**What does `verifyUnsignedTransaction` protect against?**  
It checks a hub-returned unsigned transaction (type, fare/amount, references, `from`, and `chain_id` pinned from your own app config) before you sign it, closing the gap where the SDK previously signed whatever the hub returned without checking it matched what you asked for. Pass it as `signTransaction`'s third argument. It cannot verify the `referrer` field — the hub injects that server-side with no signed-quote mechanism yet, so it's surfaced for display only.

## Faucet

**Faucet returns "disabled"?**  
Set `faucet_enabled = true` and configure `faucet_private_key` with a funded account.

**How much CLT per request?**  
`100000000` CLT (`faucet_amount_clt` in config) — that's $100 at the current peg. If the setting is left out of config entirely, the Rust code-level fallback is `1000` CLT ($0.001), but every shipped config sets the real value explicitly.

**Does the faucet work on a non-testnet chain?**  
No — the Hub API refuses to even start if `faucet_enabled = true` against a chain where `is_testnet = false`. This is a boot-time failure, not a per-request one.

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

See the full [Docker images reference](/reference/docker-images) for registry links and pull commands.

| Component | GHCR | Docker Hub |
|-----------|------|------------|
| Node | [`ghcr.io/clutchprotocol/clutch-node`](https://github.com/clutchprotocol/clutch-node/pkgs/container/clutch-node) | [`9194010019/clutch-node`](https://hub.docker.com/r/9194010019/clutch-node) |
| Hub API | [`ghcr.io/clutchprotocol/clutch-hub-api`](https://github.com/clutchprotocol/clutch-hub-api/pkgs/container/clutch-hub-api) | [`9194010019/clutch-hub-api`](https://hub.docker.com/r/9194010019/clutch-hub-api) |
| Demo app | [`ghcr.io/clutchprotocol/clutch-hub-demo-app`](https://github.com/clutchprotocol/clutch-hub-demo-app/pkgs/container/clutch-hub-demo-app) | [`9194010019/clutch-hub-demo-app`](https://hub.docker.com/r/9194010019/clutch-hub-demo-app) |
| Explorer | [`clutch-explorer-backend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-backend), [`clutch-explorer-frontend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-frontend) on GHCR | — |

## Documentation

Full docs: https://docs.clutchprotocol.io
