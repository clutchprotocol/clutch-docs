---
sidebar_position: 3
---

# Demo App User Flows

The demo app maps UI actions to SDK calls. Use it as a reference when building your own dApp.

For the full interaction between passenger and driver (including Hub API and node), see the [passenger–driver flow diagram](/getting-started/ride-lifecycle#complete-passengerdriver-flow).

## Role selection

| UI | Behavior |
|----|----------|
| Role entry screen | Choose passenger or driver |
| Connect your wallet | Lists the wallets found in the page (MetaMask, Trust Wallet, TronLink, …). A TronLink entry has a TRON tag. With none, it links to install one, or on a phone to open this page inside the wallet app |
| Connect | The wallet asks you to share an account. The app then knows your address and holds a signer that asks the wallet, never a key |
| Next visit | The wallet used last time connects again without a prompt, if it still shares the account with the site |
| Switch account in the wallet | The app follows: the new account becomes the signed-in account |
| ☰ → **Disconnect wallet** | Forgets the wallet in this app and returns to the role screen |

The app holds no private key (since 2026-10-06; before that it generated one in the browser, on the testnet too). Each action opens a prompt in your wallet, and the app says first what the prompt is for. The only things kept in `localStorage` are the id of the last wallet, the role and the local transaction history.

## Passenger flows

| UI action | SDK calls |
|-----------|-----------|
| Pick pickup/dropoff on map | — |
| Submit ride request | `createUnsignedRideRequest` → `signTransaction` → `submitTransaction` |
| View open offers | `subscribeRideOffers(requestTxHash)` or `listRideOffers` |
| Accept driver offer | `createUnsignedRideAcceptance` → sign → submit |
| Pay fare | `createUnsignedRidePay` → sign → submit (partial OK) |
| Cancel pending request | `createUnsignedRideRequestCancel` → sign → submit |
| Cancel active trip | `createUnsignedRideCancel` → sign → submit |
| View balance | `getAccountBalance` / `subscribeAccountBalance` (both `bigint`) |
| Top up (deposit) | `sdk.getAuthHeaders()` only — the deposit calls themselves go straight to `payment-orchestrator`, not the SDK. Opening the panel is the one moment the wallet is asked to sign in (when it has not yet) |
| Transaction history | localStorage per address |

Balances and fares displayed in the UI are formatted with the SDK's `formatUsd()` helper (CLT is a micro-dollar — 1 USD = 1,000,000 CLT — so raw amounts are not meant to be shown directly).

Components: `PassengerView.jsx`, `RideForm.jsx`, `ActiveTripCard.jsx`, `BalanceDisplay.jsx`.

## Top up (deposit)

Opened from the app menu (☰ → **Wallet** → **Top up**) once a wallet exists — available to either role, not just passengers, though funding a passenger wallet to pay fares is the common case. `DepositPanel.jsx` calls `payment-orchestrator` directly (`POST`/`GET /api/v1/deposits`), bypassing the Hub API and the SDK entirely except for `sdk.getAuthHeaders()`, which attaches the same Hub-issued JWT as a bearer token. See [Architecture — Deposit Flow](/getting-started/architecture#deposit-flow) for why the path is separate.

| Panel state | What it means |
|-------------|----------------|
| Loading | The address request is in flight |
| Address shown | Your permanent deposit address, the way an exchange shows one: the network (TRON, TRC-20, or the Nile testnet), the address as a QR code and as text with a Copy button, a Share button on phones, the network fee and the minimum after it, and a list of your recent deposits |
| Unavailable | The orchestrator returned `503` — deposits are temporarily switched off |
| Error | The address or deposit-list request failed |

Each row in the recent-deposits list shows an amount, an age, a truncated transaction id, and a status label — `Detected`, `Minting`, `Credited`, or `Needs review` — the same vocabulary documented in [Deposits — Status vocabulary](/clutch-treasury/deposits#status-vocabulary). The list refreshes every 10 seconds while the panel stays open, and only while the sign-in is still valid: a timer never opens a wallet prompt.

## Driver flows

| UI action | SDK calls |
|-----------|-----------|
| Top up (deposit) | `sdk.getAuthHeaders()` only — the deposit calls go straight to `payment-orchestrator`, not the SDK |
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

## Wallet prompts

Every signature is a prompt in the user's wallet: one to sign in (`clutch-auth:…`, once per 6-hour token) and one for each transaction (`clutch-tx:{chainId}:{hash}`). A wallet shows the text it signs, not the ride, so before each prompt the app shows a line such as "Approve in your wallet: pay $2.50 for this ride." If the user says no, the app says so in plain words and nothing is sent; a withdrawal burns nothing until the signature exists. Nothing on a timer opens a prompt: the subscriptions go without a token, and the 10-second refreshes in the top-up and withdraw panels run only while the sign-in is valid.

## Explorer links

The app links to the block explorer of its own network: a menu entry opens the explorer, and each row of the transaction history links to that transaction's page there. The address is worked out from the app's own: `app-stage.` becomes `explorer-stage.` (the testnet, https://explorer-stage.clutchprotocol.io), and `app.` becomes `explorer.` (the mainnet pilot, https://explorer.clutchprotocol.io). On any other host the app shows no explorer link. For local development, `VITE_EXPLORER_URL` names one (for example `http://localhost:5174`).

## Related

- [Ride Lifecycle guide](/getting-started/ride-lifecycle)
- [SDK Usage](/clutch-hub-sdk-js/usage)
- [Demo App Overview](/demo-app/overview)
