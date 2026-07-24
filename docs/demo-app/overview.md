---
sidebar_position: 1
---

# Demo App Overview

The **Clutch Hub Demo App** is a React + Vite application demonstrating blockchain-based ride-sharing with passenger and driver roles.

## Features

- **Dual roles** — Separate passenger and driver experiences
- **Wallet management** — Generate or import keys (optional localStorage)
- **Interactive map** — Leaflet map for pickup/dropoff selection
- **Full ride lifecycle** — Request, offer, accept, pay, cancel
- **Real-time updates** — GraphQL subscriptions with polling fallback
- **Faucet integration** — One-click test CLT funding
- **Transaction history** — Persistent list per wallet address
- **Stage auto-detect** — Maps `app-stage.*` hostname to `api-stage.*`

## Tech Stack

- React 19
- Vite
- Leaflet (maps)
- [clutch-hub-sdk-js](https://www.npmjs.com/package/clutch-hub-sdk-js)

## Key concepts demonstrated

1. **User sovereignty** — Users own and control their keys
2. **Client-side signing** — Private keys never sent to the server
3. **Transparency** — Transaction history visible on-chain
4. **Trustless operations** — Ride state enforced by the blockchain

## Live demos

| Environment | URL |
|-------------|-----|
| Stage | https://app-stage.clutchprotocol.io |
| Local | http://localhost:5173 |

The stage deployment is the only hosted demo; there is no production demo app yet.

## Screenshots

![Request a ride screen](/img/demo-request-ride.svg)

![Active ride list](/img/demo-ride-list.svg)

:::note
Screenshots are placeholders. To replace, capture from the running stage demo (https://app-stage.clutchprotocol.io), save as `.png` into `static/img/`, and update the references above.
:::

## Documentation

- [Getting Started](/demo-app/getting-started)
- [User Flows](/demo-app/user-flows) — UI action → SDK call mapping

## Related

- [Ride Lifecycle](/getting-started/ride-lifecycle)
- [SDK Usage](/clutch-hub-sdk-js/usage)
