---
sidebar_position: 4
---

# Docker Images

Published container images for Clutch Protocol components. All images use the `:latest` tag on the default branch; tagged releases use semver from git tags.

## Registry overview

| Registry | Scope | Login |
|----------|-------|-------|
| [GitHub Container Registry (GHCR)](https://github.com/orgs/clutchprotocol/packages) | All images below | `docker login ghcr.io` (required if packages are private) |
| [Docker Hub](https://hub.docker.com/u/9194010019) | Node, Hub API, demo app | No login required for public pulls |

:::tip
[clutch-deploy](/deployment/clutch-deploy) pulls from GHCR by default. See [Docker Deploy](/getting-started/docker-deploy) for the full stack.
:::

## Images

| Component | GHCR | Docker Hub |
|-----------|------|------------|
| **Clutch Node** | [`ghcr.io/clutchprotocol/clutch-node`](https://github.com/clutchprotocol/clutch-node/pkgs/container/clutch-node) | [`9194010019/clutch-node`](https://hub.docker.com/r/9194010019/clutch-node) |
| **Clutch Hub API** | [`ghcr.io/clutchprotocol/clutch-hub-api`](https://github.com/clutchprotocol/clutch-hub-api/pkgs/container/clutch-hub-api) | [`9194010019/clutch-hub-api`](https://hub.docker.com/r/9194010019/clutch-hub-api) |
| **Demo app** | [`ghcr.io/clutchprotocol/clutch-hub-demo-app`](https://github.com/clutchprotocol/clutch-hub-demo-app/pkgs/container/clutch-hub-demo-app) | [`9194010019/clutch-hub-demo-app`](https://hub.docker.com/r/9194010019/clutch-hub-demo-app) |
| **Explorer backend** | [`ghcr.io/clutchprotocol/clutch-explorer-backend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-backend) | — |
| **Explorer frontend** | [`ghcr.io/clutchprotocol/clutch-explorer-frontend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-frontend) | — |

## Pull examples

```bash
# GHCR (used by clutch-deploy)
docker pull ghcr.io/clutchprotocol/clutch-node:latest
docker pull ghcr.io/clutchprotocol/clutch-hub-api:latest
docker pull ghcr.io/clutchprotocol/clutch-hub-demo-app:latest
docker pull ghcr.io/clutchprotocol/clutch-explorer-backend:latest
docker pull ghcr.io/clutchprotocol/clutch-explorer-frontend:latest

# Docker Hub (node, API, demo only)
docker pull 9194010019/clutch-node:latest
docker pull 9194010019/clutch-hub-api:latest
docker pull 9194010019/clutch-hub-demo-app:latest
```

## Related

- [Docker Deploy](/getting-started/docker-deploy) — local full stack
- [Clutch Deploy](/deployment/clutch-deploy) — compose files and stage deployment
- [Running Clutch Node](/clutch-node/running) — single-node Docker run
- [Hub API overview](/clutch-hub-api/overview) — API container usage
