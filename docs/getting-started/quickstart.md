---
sidebar_position: 1
---

# Quick Start

Get the Clutch Protocol stack running in minutes.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- (Optional) GHCR login for private images: `docker login ghcr.io`

## 1. Clone and Start

```bash
git clone https://github.com/clutchprotocol/clutch-deploy.git
cd clutch-deploy

cp .env.example .env

docker compose up -d
```

## 2. Verify

| Service | URL |
|---------|-----|
| API Health | http://localhost:3000/health |
| GraphQL | http://localhost:3000/graphql |
| Grafana | http://localhost:3030 (admin/admin) |
| Seq Logs | http://localhost:5341 |

## 3. Try the Demo App

```bash
git clone https://github.com/clutchprotocol/clutch-hub-demo-app.git
cd clutch-hub-demo-app
npm install
npm run dev
```

Visit http://localhost:5173 and request a ride.

## Next Steps

- [Architecture](/getting-started/architecture) — Understand the system
- [Clutch Hub API](/clutch-hub-api/overview) — API details
- [SDK](/clutch-hub-sdk-js/overview) — Build your own app
