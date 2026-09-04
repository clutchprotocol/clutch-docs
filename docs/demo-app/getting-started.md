---
sidebar_position: 2
---

# Demo App Getting Started

## Prerequisites

- Node.js 20+
- Running Clutch stack ([clutch-deploy](/deployment/clutch-deploy)) or API at `http://localhost:3000`

## Setup

```bash
git clone https://github.com/clutchprotocol/clutch-hub-demo-app.git
cd clutch-hub-demo-app
npm install
npm run dev
```

Visit http://localhost:5173

Or use the demo included in clutch-deploy at http://localhost:5173 after `docker compose up -d`.

Docker image: [`ghcr.io/clutchprotocol/clutch-hub-demo-app`](https://github.com/clutchprotocol/clutch-hub-demo-app/pkgs/container/clutch-hub-demo-app) · [Docker Hub](https://hub.docker.com/r/9194010019/clutch-hub-demo-app). See [Docker images](/reference/docker-images).

## Configuration

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Hub API base URL | `http://localhost:3000` |
| `VITE_PUBLIC_NODE_ENDPOINTS` | Comma-separated node WS URLs for network tab | empty |
| `VITE_CHAIN_ID` | Chain id pinned client-side for the auth challenge and `signTransaction`'s verification pin — never sourced from the Hub | `2077` |
| `VITE_ORCHESTRATOR_URL` | `payment-orchestrator` base URL, used by the deposit panel | `/payment` (a same-origin path, proxied by nginx) |
| `VITE_CARTO_API_KEY` | CARTO basemap API key (Voyager / Dark Matter map tiles) | empty — falls back to OpenStreetMap tiles |

Because `VITE_ORCHESTRATOR_URL` defaults to a proxied path rather than a full URL, running `npm run dev` standalone (no nginx in front of it) leaves the deposit panel calling `/payment/...` on the Vite dev server itself, which 404s. Either run the full stack via [clutch-deploy](/deployment/clutch-deploy), or set `VITE_ORCHESTRATOR_URL` to the orchestrator's own address (e.g. `http://localhost:8091`) for standalone dev.

Example:

```bash
VITE_API_URL=http://localhost:3000 npm run dev
```

### Auto-detection

`src/config.js` automatically selects the API URL:

- `app-stage.*` hostname → `api-stage.*`
- Port 81 (legacy) → API on port 82
- Otherwise → `VITE_API_URL` or `http://localhost:3000`

## Using the app

1. Select **Passenger** or **Driver**
2. Generate a wallet or import existing keys
3. Fund the wallet: ☰ → **Top up with USDT**, then send USDT (TRC-20) to the address shown
4. Follow the [User Flows](/demo-app/user-flows) for each role

## localStorage keys

| Key pattern | Purpose |
|-------------|---------|
| `clutch_passenger_publicKey` | Passenger wallet |
| `clutch_passenger_privateKey` | Passenger key (if remembered) |
| `clutch_driver_publicKey` | Driver wallet |
| `clutch_driver_privateKey` | Driver key (if remembered) |
| `clutch_tx_[address]` | Transaction history per address |

## Security note

The demo optionally stores keys in localStorage for convenience. **Never do this in production.** Use hardware wallets, secure enclaves, or per-action key prompts instead.

## Related

- [User Flows](/demo-app/user-flows)
- [Environments](/getting-started/environments)
