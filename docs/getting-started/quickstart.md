---
sidebar_position: 1
---

# Quick Start

Get the Clutch Protocol stack running locally with Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- (Optional) GHCR login for private images: `docker login ghcr.io`

## Run the Full Stack

```bash
git clone https://github.com/clutchprotocol/clutch-deploy.git
cd clutch-deploy

cp .env.example .env

docker compose up -d
```

## Verify

| Service | URL |
|---------|-----|
| API Health | http://localhost:3000/health |
| GraphQL | http://localhost:3000/graphql |
| Grafana | http://localhost:3030 (admin/admin) |
| Seq Logs | http://localhost:5341 |

## Next Steps

- [Docker Deploy](/getting-started/docker-deploy) — Full configuration details
- [Clutch Hub API](/clutch-hub-api/overview) — API usage
- [SDK](/clutch-hub-sdk-js/overview) — Integrate with your app
