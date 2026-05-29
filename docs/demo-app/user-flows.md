---
sidebar_position: 3
---

# Demo App User Flows

The demo app maps UI actions to SDK calls. Use it as a reference when building your own dApp.

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
| View balance | `getAccountBalance` / `subscribeAccountBalance` |
| Transaction history | localStorage per address |

Components: `PassengerView.jsx`, `RideForm.jsx`, `ActiveTripCard.jsx`, `BalanceDisplay.jsx`.

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
