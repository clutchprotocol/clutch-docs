---
sidebar_position: 6
---

# Environments

Clutch Protocol can run locally via Docker or on the public stage deployment.

## Local development

Start the full stack with [clutch-deploy](/deployment/clutch-deploy):

```bash
git clone https://github.com/clutchprotocol/clutch-deploy.git
cd clutch-deploy
cp .env.example .env
docker compose up -d
```

Replace the placeholder `JWT_SECRET` in `.env` first — the Hub API refuses to start on it. See [Quick Start](/getting-started/quickstart) for the generation command.

| Service | URL |
|---------|-----|
| Hub API | http://localhost:3000 |
| API health | http://localhost:3000/health |
| GraphQL | http://localhost:3000/graphql |
| Demo app | http://localhost:5173 |
| Explorer UI | http://localhost:5174 |
| Explorer API | http://localhost:8088 |
| Node 1 WS | ws://localhost:8081/ws |
| Grafana | http://localhost:3030 |
| Seq logs | http://localhost:5341 |

SDK connection:

```javascript
const sdk = new ClutchHubSdk('http://localhost:3000', publicKey);
```

Demo app (standalone clone):

```bash
git clone https://github.com/clutchprotocol/clutch-hub-demo-app.git
cd clutch-hub-demo-app
npm install
VITE_API_URL=http://localhost:3000 npm run dev
```

## Stage (public testnet)

The stage deployment uses Cloudflare and nginx in front of the stack:

| Service | URL |
|---------|-----|
| Demo app | https://app-stage.clutchprotocol.io |
| Hub API | https://api-stage.clutchprotocol.io |
| Node 1 | wss://node1-stage.clutchprotocol.io/ws |
| Node 2 | wss://node2-stage.clutchprotocol.io/ws |
| Node 3 | wss://node3-stage.clutchprotocol.io/ws |

SDK connection:

```javascript
const sdk = new ClutchHubSdk('https://api-stage.clutchprotocol.io', publicKey);
```

The demo app auto-detects stage URLs: when served from `app-stage.clutchprotocol.io`, it uses `api-stage.clutchprotocol.io` automatically.

## Production demo

| Service | URL |
|---------|-----|
| Marketing site | https://clutchprotocol.io |
| Documentation | https://docs.clutchprotocol.io |

There is no production demo app yet — `demo.clutchprotocol.io` is not deployed. Use the stage demo app above, or run the stack locally.

:::warning Alpha
The stage environment is for testing. APIs and endpoints may change.
:::

## Environment variables

### Hub API

Loaded from `config/{env}.toml` with `APP_` prefix overrides. Key settings:

| Setting | Default (local) | Description |
|---------|-----------------|-------------|
| `ws_addr` | `0.0.0.0:3000` | HTTP bind address |
| `clutch_node_ws_url` | `ws://127.0.0.1:8081/ws` | Node WebSocket |
| `jwt_secret` | — | JWT signing secret |

See [API Configuration](/clutch-hub-api/configuration).

### Demo app

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Hub API base URL |
| `VITE_PUBLIC_NODE_ENDPOINTS` | Comma-separated node WS URLs for network info tab |
| `VITE_CHAIN_ID` | Chain id pinned client-side for auth/signing (default `2077`) |
| `VITE_ORCHESTRATOR_URL` | `payment-orchestrator` base URL for the deposit panel (default `/payment`, a proxied same-origin path — see the note below) |
| `VITE_CARTO_API_KEY` | CARTO basemap API key; unset falls back to OpenStreetMap tiles |

`VITE_ORCHESTRATOR_URL`'s default assumes nginx is proxying `/payment/` to the orchestrator, which is true for the full compose stack but not for a standalone `npm run dev` — see [Demo App Getting Started](/demo-app/getting-started#environment-variables) for the local workaround.

### Explorer

| Variable | Description |
|----------|-------------|
| `VITE_EXPLORER_API_URL` | Explorer backend URL (default `http://localhost:8088`) |

## Funding a wallet

Every environment funds a wallet the same way: deposit USDT. Each wallet gets one permanent Tron address from `payment-orchestrator`, and USDT (TRC-20) sent to it is minted as CLT to that wallet — there is no environment where CLT is handed out for free. See [Deposits](/clutch-treasury/deposits).

## Choosing an environment

| Use case | Environment |
|----------|-------------|
| Local development | Docker compose on localhost |
| Integration testing | Stage URLs |
| Learning / demo | Stage demo app or local stack |
| Block explorer | Local `:5174` or deploy with compose |
