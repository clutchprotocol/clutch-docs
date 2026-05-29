---
sidebar_position: 1
---

# Quick Start

Get the Clutch Protocol stack running in minutes.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Node.js 20+ (only if running demo app outside Docker)
- (Optional) GHCR login: `docker login ghcr.io`

## 1. Clone and start full stack

```bash
git clone https://github.com/clutchprotocol/clutch-deploy.git
cd clutch-deploy

cp .env.example .env

docker compose up -d
```

This starts nodes, Hub API, demo app, explorer, Prometheus, Grafana, and Seq.

## 2. Verify services

| Service | URL |
|---------|-----|
| API health | http://localhost:3000/health |
| GraphQL | http://localhost:3000/graphql |
| Demo app | http://localhost:5173 |
| Explorer | http://localhost:5174 |
| Grafana | http://localhost:3030 (admin/admin) |
| Seq logs | http://localhost:5341 |

## 3. Try the demo app

Open http://localhost:5173:

1. Choose **Passenger** or **Driver**
2. Generate or import a wallet
3. Click **Request CLT** to fund via faucet
4. As passenger: pick locations on the map and request a ride
5. As driver: view requests and submit an offer

Or run the demo standalone:

```bash
git clone https://github.com/clutchprotocol/clutch-hub-demo-app.git
cd clutch-hub-demo-app
npm install
VITE_API_URL=http://localhost:3000 npm run dev
```

## 4. Build with the SDK

```bash
npm install clutch-hub-sdk-js
```

```javascript
import { ClutchHubSdk } from 'clutch-hub-sdk-js';

const sdk = new ClutchHubSdk('http://localhost:3000', publicKey);
await sdk.requestFaucet(publicKey);
```

See [Ride Lifecycle](/getting-started/ride-lifecycle) for the full flow.

## Next steps

- [Environments](/getting-started/environments) — Local vs stage URLs
- [Architecture](/getting-started/architecture) — System design
- [Clutch Hub API](/clutch-hub-api/overview) — GraphQL reference
- [SDK](/clutch-hub-sdk-js/overview) — Build your own app
- [Explorer](/clutch-explorer/overview) — Browse on-chain data
