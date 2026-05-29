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
3. Request test CLT from the faucet
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
