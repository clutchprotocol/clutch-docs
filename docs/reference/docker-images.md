---
sidebar_position: 5
---

# Docker Images

Published container images for Clutch Protocol components. All images use the `:latest` tag on the default branch; tagged releases use semver from git tags.

All images are on [GitHub Container Registry (GHCR)](https://github.com/orgs/clutchprotocol/packages) only. Pulling publicly needs no login; `docker login ghcr.io` is only required for private packages.

:::note
Images also published to Docker Hub through 2026-09-18. That registry received no pulls from anything this project deploys — `clutch-deploy`'s compose files always pointed at GHCR — so publishing there was dropped rather than kept in sync for no reader. The Docker Hub repositories still exist with their last images; nothing new lands there.
:::

:::tip
[clutch-deploy](/deployment/clutch-deploy) pulls from GHCR by default. See [Docker Deploy](/getting-started/docker-deploy) for the full stack.
:::

## Images

| Component | GHCR |
|-----------|------|
| **Clutch Node** | [`ghcr.io/clutchprotocol/clutch-node`](https://github.com/clutchprotocol/clutch-node/pkgs/container/clutch-node) |
| **Clutch Hub API** | [`ghcr.io/clutchprotocol/clutch-hub-api`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-hub-api) |
| **Demo app** | [`ghcr.io/clutchprotocol/clutch-hub-demo-app`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-hub-demo-app) |
| **Explorer backend** | [`ghcr.io/clutchprotocol/clutch-explorer-backend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-backend) |
| **Explorer frontend** | [`ghcr.io/clutchprotocol/clutch-explorer-frontend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-frontend) |

## Pull examples

```bash
docker pull ghcr.io/clutchprotocol/clutch-node:latest
docker pull ghcr.io/clutchprotocol/clutch-hub-api:latest
docker pull ghcr.io/clutchprotocol/clutch-hub-demo-app:latest
docker pull ghcr.io/clutchprotocol/clutch-explorer-backend:latest
docker pull ghcr.io/clutchprotocol/clutch-explorer-frontend:latest
```

## Related

- [Docker Deploy](/getting-started/docker-deploy) — local full stack
- [Clutch Deploy](/deployment/clutch-deploy) — compose files and stage deployment
- [Running Clutch Node](/clutch-node/running) — single-node Docker run
- [Hub API overview](/clutch-hub-api/overview) — API container usage
