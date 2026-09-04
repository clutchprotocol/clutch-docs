---
sidebar_position: 3
---

# Demo App User Flows

The demo app maps UI actions to SDK calls. Use it as a reference when building your own dApp.

For the full interaction between passenger and driver (including Hub API and node), see the [passenger–driver flow diagram](/getting-started/ride-lifecycle#complete-passengerdriver-flow).

## Role selection

| UI | Behavior |
|----|----------|
| Role entry screen | Choose passenger or driver — separate wallet scopes |
| Generate wallet | Local key generation (`wallet.js`) |
| Import wallet | Paste existing public/private key pair |

Keys are stored per role: `clutch_passenger_*`, `clutch_driver_*` in localStorage.

## Passenger flows

| UI action | SDK calls |
|-----------|-----------|
| Request CLT | `requestFaucet(publicKey)` |
| Pick pickup/dropoff on map | — |
| Submit ride request | `createUnsignedRideRequest` → `signTransaction` → `submitTransaction` |
| View open offers | `subscribeRideOffers(requestTxHash)` or `listRideOffers` |
| Accept driver offer | `createUnsignedRideAcceptance` → sign → submit |
| Pay fare | `createUnsignedRidePay` → sign → submit (partial OK) |
| Cancel pending request | `createUnsignedRideRequestCancel` → sign → submit |
| Cancel active trip | `createUnsignedRideCancel` → sign → submit |
| View balance | `getAccountBalance` / `subscribeAccountBalance` (both `bigint`) |
| Top up (deposit) | `sdk.getAuthHeaders()` only — the deposit calls themselves go straight to `payment-orchestrator`, not the SDK |
| Transaction history | localStorage per address |

Balances and fares displayed in the UI are formatted with the SDK's `formatUsd()` helper (CLT is a micro-dollar — 1 USD = 1,000,000 CLT — so raw amounts are not meant to be shown directly).

Components: `PassengerView.jsx`, `RideForm.jsx`, `ActiveTripCard.jsx`, `BalanceDisplay.jsx`.

## Top up (deposit)

Opened from the app menu (☰ → **Top up with USDT**) once a wallet exists — available to either role, not just passengers, though funding a passenger wallet to pay fares is the common case. `DepositPanel.jsx` calls `payment-orchestrator` directly (`POST`/`GET /api/v1/deposits`), bypassing the Hub API and the SDK entirely except for `sdk.getAuthHeaders()`, which attaches the same Hub-issued JWT as a bearer token. See [Architecture — Deposit Flow](/getting-started/architecture#deposit-flow) for why the path is separate.

| Panel state | What it means |
|-------------|----------------|
| Loading | The address request is in flight |
| Address shown | Your permanent deposit address, plus a list of your recent deposits |
| Unavailable | The orchestrator returned `503` — deposits are temporarily switched off |
| Error | The address or deposit-list request failed |

Each row in the recent-deposits list shows an amount, an age, a truncated transaction id, and a status label — `Detected`, `Minting`, `Credited`, or `Needs review` — the same vocabulary documented in [Deposits — Status vocabulary](/clutch-treasury/deposits#status-vocabulary). The list refreshes every 10 seconds while the panel stays open.

## Driver flows

| UI action | SDK calls |
|-----------|-----------|
| Request CLT | `requestFaucet(publicKey)` |
| View ride requests | `subscribeRideRequests` or `listRideRequests` |
| Submit offer | `createUnsignedRideOffer` → sign → submit |
| View active trips | `subscribeActiveTrips({ driverAddress })` |
| Cancel active trip | `createUnsignedRideCancel` → sign → submit |
| View balance | `getAccountBalance` / `subscribeAccountBalance` |

Components: `DriverView.jsx`, `ActiveTripCard.jsx`.

## Real-time updates

`sdkRealtime.js` wraps SDK subscriptions with HTTP polling fallback:

1. Try WebSocket subscription via `subscribe*`
2. On failure, fall back to periodic `list*` queries

## Network info

`GeneralView.jsx` displays configured endpoints:

- Hub API URL (auto-detected from hostname)
- Public node WebSocket URLs (`VITE_PUBLIC_NODE_ENDPOINTS`)
- Links to GitHub repos and stage nodes

## Private key prompt

Sensitive actions trigger `usePrivateKeyRequest` modal — user enters private key per action if not stored locally.

## Explorer links

`ExplorerTabs` links to the block explorer for transaction lookup (external URL based on deployment).

## Related

- [Ride Lifecycle guide](/getting-started/ride-lifecycle)
- [SDK Usage](/clutch-hub-sdk-js/usage)
- [Demo App Overview](/demo-app/overview)
