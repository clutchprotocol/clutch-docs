---
sidebar_position: 5
---

# Docker Images

Published container images for Clutch Protocol components. All are on [GitHub Container Registry (GHCR)](https://github.com/orgs/clutchprotocol/packages), and pulling them needs no login.

## Images

| Component | GHCR | Source |
|-----------|------|--------|
| **Clutch Node** | [`ghcr.io/clutchprotocol/clutch-node`](https://github.com/clutchprotocol/clutch-node/pkgs/container/clutch-node) | `clutch-node` |
| **Clutch Hub API** | [`ghcr.io/clutchprotocol/clutch-hub-api`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-hub-api) | `clutch-hub/services/hub-api` |
| **Demo app** | [`ghcr.io/clutchprotocol/clutch-hub-demo-app`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-hub-demo-app) | `clutch-hub/apps/demo` |
| **Explorer backend** (API and indexer) | [`ghcr.io/clutchprotocol/clutch-explorer-backend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-backend) | `clutch-explorer/backend` |
| **Explorer frontend** | [`ghcr.io/clutchprotocol/clutch-explorer-frontend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-frontend) | `clutch-explorer/frontend` |
| **Treasury service** | [`ghcr.io/clutchprotocol/clutch-treasury`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-treasury) | `clutch-treasury` |
| **Payment orchestrator** | [`ghcr.io/clutchprotocol/clutch-orchestrator`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-orchestrator) | `clutch-treasury` |
| **Tron signer** | [`ghcr.io/clutchprotocol/clutch-tron-signer`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-tron-signer) | `clutch-treasury` |

The explorer indexer is not a separate image: it is the backend image started with the `indexer` binary.

## Tags

Every build on `main` pushes two tags:

- **`sha-<7>`**, the first seven characters of the commit, for example `sha-d0c3d0a`. This is the tag to deploy.
- **`latest`**, which moves with every build. It is fine for trying things out on your machine.

The deployed stacks never use `latest`. [clutch-deploy](/deployment/clutch-deploy) pins every Clutch image to a `sha-<7>` tag, so a deploy ships exactly the builds named in its compose files and nothing newer. A pin moves in its own commit, and rolling back is a revert of that commit.

## Pull examples

```bash
# The build the stage stack runs, from clutch-deploy's docker-compose.yml
docker pull ghcr.io/clutchprotocol/clutch-node:sha-d0c3d0a

# The newest build, for local experiments
docker pull ghcr.io/clutchprotocol/clutch-node:latest
docker pull ghcr.io/clutchprotocol/clutch-hub-api:latest
docker pull ghcr.io/clutchprotocol/clutch-hub-demo-app:latest
docker pull ghcr.io/clutchprotocol/clutch-explorer-backend:latest
docker pull ghcr.io/clutchprotocol/clutch-explorer-frontend:latest
```

:::note
Images were also published to Docker Hub until 2026-09-18. Nothing this project deploys ever pulled from there, so that publishing was dropped. Use GHCR.
:::

## Related

- [Docker Deploy](/getting-started/docker-deploy) — local full stack
- [Clutch Deploy](/deployment/clutch-deploy) — compose files, pinned tags and stage deployment
- [Treasury Stack](/deployment/treasury-stack) — the three treasury images
- [Running Clutch Node](/clutch-node/running) — single-node Docker run
- [Hub API overview](/clutch-hub-api/overview) — API container usage
