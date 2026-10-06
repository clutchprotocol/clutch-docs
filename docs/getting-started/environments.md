---
sidebar_position: 6
---

# Environments

Clutch Protocol can run locally via Docker, on the public stage deployment (a testnet), or on the mainnet pilot.

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

Demo app, from the clutch-hub repo:

```bash
git clone https://github.com/clutchprotocol/clutch-hub.git
cd clutch-hub
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

## Mainnet (capped pilot)

The mainnet runs chain id `1000`. It has been open to every account since 2026-10-05 as a **capped pilot**: alpha software, real USDT, small limits. It is a different chain from the testnet, and nothing carries over between the two.

| Service | URL |
|---------|-----|
| Demo app | https://app.clutchprotocol.io |
| Hub API | https://api.clutchprotocol.io |

There are no public node WebSocket addresses and no block explorer for the mainnet yet. The Hub API is the way in.

SDK connection. Pass the chain id, so that the SDK pins it for signing:

```javascript
// A script or a server with its own key. In a browser app pass the user's wallet signer instead.
const sdk = new ClutchHubSdk('https://api.clutchprotocol.io', publicKey, privateKey, 1000);
```

The demo app auto-detects the chain: when served from `app.clutchprotocol.io`, it uses chain `1000` and `api.clutchprotocol.io`.

To get CLT, connect your wallet (MetaMask or Trust Wallet; on a phone, open the app inside the wallet app), open the menu, choose **Wallet**, then the **Top up** tab, and send USDT (TRC-20, on the Tron mainnet) to the address it shows. There is no faucet. The treasury mints CLT to your wallet for the amount you sent, minus the network fee below.

The pilot's limits:

| What | Limit |
|------|-------|
| One top-up | $100 of CLT. A top-up that would credit more is not credited by itself: it waits for a manual review, and your USDT stays safe at your address in the meantime |
| Top-ups per day | $200 of CLT in any rolling 24 hours. A top-up that would pass it waits, and is credited when older ones leave the window |
| Smallest top-up | $5 after the network fee. A smaller one credits nothing and waits for a manual decision |
| Network fee | $4.00 is taken from your first top-up and $2.00 from each later one, to pay the relay that moves the USDT out of your address. The relay charges less today ($3.00 and $1.50) and its price can change. The difference is not refunded: it stays in the reserve as extra backing. The app shows the fee before you pay |
| Withdrawal | **Not open yet.** When it opens: $25 to $50 per withdrawal, a $2.00 fee, and a rolling 24-hour ceiling of $200 for everyone together. See [Redemptions](/clutch-treasury/redemptions) |

:::danger Real money, alpha software
Use only what you can afford to lose. The pilot is not audited. Its three validators run on one host, and the treasury's mint and payout keys are plain keys on the server: see [Mainnet Readiness](/reference/mainnet-readiness). The demo app holds **no key of yours**: you connect your own wallet (MetaMask or Trust Wallet), which keeps the key and asks you before each action. Keep the wallet's recovery phrase safe: it is the only way back to your account and your CLT, and nobody can recover it for you.
:::

## Website and documentation

| Service | URL |
|---------|-----|
| Marketing site | https://clutchprotocol.io |
| Documentation | https://docs.clutchprotocol.io |

:::warning Alpha
The stage environment is for testing, and the mainnet is a capped pilot. APIs and endpoints may change.
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
| Real USDT, small amounts, alpha risk | Mainnet pilot |
| Block explorer | Local `:5174` or deploy with compose |
