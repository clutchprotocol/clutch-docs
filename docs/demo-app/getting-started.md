---
sidebar_position: 2
---

# Demo App Getting Started

## Prerequisites

- Node.js 20+
- Running Clutch stack ([clutch-deploy](/deployment/clutch-deploy)) or API at `http://localhost:3000`

## Setup

```bash
git clone https://github.com/clutchprotocol/clutch-hub-sdk-js.git
cd clutch-hub-sdk-js
npm install
npm run dev
```

The demo app lives at `apps/demo` in that repo, alongside the SDK at `packages/sdk` — merged 2026-09-18 so the two are tested and versioned together. `npm run dev` at the repo root runs the demo app; `npm install` installs and builds both.

Visit http://localhost:5173

Or use the demo included in clutch-deploy at http://localhost:5173 after `docker compose up -d`.

Docker image: [`ghcr.io/clutchprotocol/clutch-hub-demo-app`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-hub-demo-app). See [Docker images](/reference/docker-images).

## Configuration

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Hub API base URL | `http://localhost:3000` |
| `VITE_CHAIN_ID` | Chain id pinned client-side for the auth challenge and `signTransaction`'s verification pin — never sourced from the Hub | `2077` |
| `VITE_ORCHESTRATOR_URL` | `payment-orchestrator` base URL, used by the deposit panel | `/payment` (a same-origin path, proxied by nginx) |
| `VITE_CARTO_API_KEY` | CARTO basemap API key (Voyager / Dark Matter map tiles) | empty — falls back to OpenStreetMap tiles |
| `VITE_EXPLORER_URL` | Block explorer for local development only; deployed hosts work it out from their own address | empty — no explorer link |

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
2. **Connect your wallet** — MetaMask, Trust Wallet or TronLink. On a phone, open the page inside the wallet app (the app shows a link when it finds no wallet); on a computer, install the extension first. TronLink shows your address as `T…`; the app shows the same account as `0x…`
3. Fund the wallet: ☰ → **Wallet** → **Top up**, then send USDT (TRC-20) to the address shown
4. Follow the [User Flows](/demo-app/user-flows) for each role

Your wallet asks you to approve each action. It shows a short text that starts with `clutch-`, not the ride itself, so the app says what each prompt is for before it opens. The first action after you open the page also asks you to sign in (a text that starts with `clutch-auth`). That sign-in lasts 6 hours.

## What the app stores

The app **holds no private key**. Your wallet keeps it and signs. Until 2026-10-06 the demo generated a key in the browser and stored it in `localStorage` in plain text; that, the backup file and the "never put real funds behind a key created here" notice are gone, on the testnet too. The first time the new version starts it deletes the `clutch_passenger_*` and `clutch_driver_*` entries that the old one left.

| Key | Purpose |
|-----|---------|
| `clutch_wallet_id` | Which wallet you used last (for example `io.metamask`, or `org.tronlink.www` for TronLink), so the next visit connects without a prompt. Never a key |
| `clutch_demo_role` | Which role you picked |
| `clutch_tx_[address]` | Transaction history per address |

## Security note

Nothing in the browser can sign for you except your wallet, and it asks first. **Disconnect wallet** in the menu forgets the wallet in this app; to remove the site from your wallet's list, do it in the wallet. Not built yet: WalletConnect (a wallet on your phone that scans a code shown on a computer).

## Related

- [User Flows](/demo-app/user-flows)
- [Environments](/getting-started/environments)
