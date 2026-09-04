---
sidebar_position: 1
---

# Clutch Hub API Overview

Clutch Hub API bridges applications to the Clutch Node blockchain. It builds unsigned transactions, submits signed transactions, and exposes chain state via GraphQL.

## HTTP endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness check |
| `/graphql` | POST | GraphQL queries and mutations |
| `/graphql/ws` | GET | GraphQL subscriptions (WebSocket) |

There is **no** REST user registration or login. Authentication is wallet-based JWT via GraphQL `generateToken`. See [Authentication](/clutch-hub-api/authentication).

## Features

- Wallet JWT authentication
- Unsigned transaction generation for the full ride lifecycle
- Signed transaction submission to the node
- GraphQL queries for ride lists and account balance
- GraphQL subscriptions (poll-based snapshots from the node)
- Seq integration for structured logging
- Prometheus metrics sidecar (configurable)

## Architecture role

```
Your App / SDK  ──►  Hub API (GraphQL)  ──►  Clutch Node (WebSocket JSON-RPC)
```

The API never receives private keys. Apps sign transactions client-side and submit raw RLP hex via `sendRawTransaction`.

## Docker

Pull from [GHCR](https://github.com/clutchprotocol/clutch-hub-api/pkgs/container/clutch-hub-api) or [Docker Hub](https://hub.docker.com/r/9194010019/clutch-hub-api). See [Docker images](/reference/docker-images) for all packages.

```bash
docker pull ghcr.io/clutchprotocol/clutch-hub-api:latest
docker run -p 3000:3000 -v $(pwd)/config:/app/config:ro ghcr.io/clutchprotocol/clutch-hub-api:latest
```

Or use [clutch-deploy](/deployment/clutch-deploy) for the full stack.

## Documentation

- [GraphQL reference](/clutch-hub-api/graphql)
- [Subscriptions](/clutch-hub-api/subscriptions)
- [Configuration](/clutch-hub-api/configuration)
