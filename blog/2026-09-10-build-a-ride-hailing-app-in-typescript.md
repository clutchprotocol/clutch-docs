---
slug: build-a-ride-hailing-app-in-typescript
title: Build a ride-hailing app on a blockchain in 125 lines of TypeScript
description: Request, offer, acceptance, payment. One script against the Clutch public testnet, keys that never leave your machine, and a driver paid about a second after each payment.
authors: [mehran]
tags: [tutorial, sdk]
---

By the end of this post you will have run a complete ride on the Clutch public testnet from one TypeScript file. A passenger requests a ride, a driver offers, the passenger accepts and pays in two installments, and the driver's balance moves about a second after each payment. No backend, no database, no payment provider. Two keypairs your script generates, a public GraphQL Hub, and a chain whose transaction types are the steps of a ride.

<!-- truncate -->

## Why it fits in one file

Clutch is not a general-purpose chain with a ride-sharing contract on top. The ride lifecycle *is* the transaction set: `RideRequest`, `RideOffer`, `RideAcceptance`, `RidePay`, and two cancels. That changes what an app has to do:

1. Ask the Hub API to build an unsigned transaction. The Hub fills in the nonce and the chain id; it never sees a private key.
2. Check the Hub's answer against what you asked for, then sign it locally with secp256k1.
3. Submit the signed bytes. The validators verify signature, nonce, and chain id, and the transaction lands in the next block, about a second later.

Everything else, matching, escrow, fee splits, is a rule the node enforces, not code you write. Every transaction pays a flat fee of 1,000 CLT to the author of the block it lands in. CLT is a micro-dollar (1 USD = 1,000,000 CLT), so that is $0.001. There is no gas market and no token to price.

## Before you start

- Node.js 20 or newer.
- A Tron wallet you can switch to the **Nile testnet**, such as [TronLink](https://www.tronlink.org/). CLT is only ever minted against a USDT deposit, and on the stage testnet that means Nile USDT, which has no value. The [Nile faucet](https://nileex.io/join/getJoinPage) hands out test TRX and test USDT. Setting this up is most of the ten minutes this takes.
- Alpha software. The stage chain can be reset and APIs can change. The SDK version is pinned below for that reason.

## Set up the project

```bash
mkdir clutch-ride && cd clutch-ride
npm init -y
npm pkg set type=module
npm install clutch-hub-sdk-js@4.0.0 @noble/secp256k1@2 @noble/hashes@1
npm install -D tsx
```

`tsx` runs TypeScript directly, so there is no build step. The two `@noble` packages are the SDK's own signing dependencies; the script uses them for one thing, generating keys.

Create `ride.ts` and add the pieces below in order. The whole file is at the end of the post.

## Two wallets

```ts
// ride.ts — one ride on the Clutch stage testnet: request, offer, accept, pay.
import { ClutchHubSdk, formatUsd } from 'clutch-hub-sdk-js';
import type { ExpectedTx, UnsignedTransaction } from 'clutch-hub-sdk-js';
import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const API_URL = 'https://api-stage.clutchprotocol.io';
const ORCHESTRATOR_URL = 'https://app-stage.clutchprotocol.io/payment';
const CHAIN_ID = 2077; // from your own config — never read back from the hub
const TX_FEE = 1_000n; // flat fee per transaction, paid to the block author
const FARE = 5_000_000n; // $5.00 — CLT is a micro-dollar, so amounts are bigint

type Wallet = { address: string; privateKey: string };

function newWallet(): Wallet {
  const priv = secp.utils.randomPrivateKey();
  const pub = secp.getPublicKey(priv, false); // 65 bytes, 0x04-prefixed
  const address = '0x' + bytesToHex(keccak_256(pub.slice(1)).slice(12));
  return { address, privateKey: '0x' + bytesToHex(priv) };
}

function loadWallets(): { passenger: Wallet; driver: Wallet } {
  if (existsSync('wallets.json')) return JSON.parse(readFileSync('wallets.json', 'utf8'));
  const wallets = { passenger: newWallet(), driver: newWallet() };
  writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
  return wallets;
}
```

An account on Clutch is an Ethereum-style address: the last 20 bytes of the Keccak-256 hash of the uncompressed public key. The SDK's constructor calls this parameter `publicKey`; it is the address. The script saves both keypairs to `wallets.json` so you can re-run it against the same funded wallets. These are test keys for a test network. Do not reuse them anywhere.

Two constants deserve a note. `CHAIN_ID` is pinned in your own code on purpose: the SDK uses it in the login challenge and to verify every transaction the Hub hands back, so asking the Hub what chain it is would defeat the point. And every amount is a `bigint`. A JavaScript `number` silently loses precision above 2^53, which is a reachable amount at this peg.

## Fund them

```ts
async function depositAddress(sdk: ClutchHubSdk): Promise<string> {
  const res = await fetch(`${ORCHESTRATOR_URL}/api/v1/deposits`, {
    method: 'POST',
    headers: await sdk.getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`deposit address: HTTP ${res.status}`);
  return ((await res.json()) as { address: string }).address;
}
```

There is no faucet. Every wallet has one permanent Tron address, derived by the treasury's payment orchestrator; USDT sent to it is verified on Tron and the matching CLT is minted to the wallet. `getAuthHeaders()` makes the SDK log in first: it signs a challenge with the private key and exchanges it for a JWT, so the orchestrator knows which wallet to credit. Nothing but the signature leaves your machine.

Asking for the address also marks it "hot", which puts it at the front of the polling queue, so a deposit made right after is usually credited within a couple of minutes. There is no minimum and no exact amount to match: whatever lands is credited in full.

## Send a transaction, then wait for the chain

```ts
async function send(sdk: ClutchHubSdk, wallet: Wallet, unsigned: UnsignedTransaction, expected: ExpectedTx) {
  // signTransaction checks the hub's blob against `expected` before signing. A hub that
  // swapped the fare or the reference makes this throw instead of getting a signature.
  const signed = await sdk.signTransaction(unsigned, wallet.privateKey, expected);
  await sdk.submitTransaction(signed.rawTransaction);
  return signed.txHash;
}

async function until<T>(what: string, probe: () => Promise<T | undefined>, everyMs = 2_000, forMs = 180_000): Promise<T> {
  const deadline = Date.now() + forMs;
  while (Date.now() < deadline) {
    const found = await probe();
    if (found !== undefined) return found;
    await new Promise((r) => setTimeout(r, everyMs));
  }
  throw new Error(`gave up waiting for: ${what}`);
}

const sameHash = (a: string, b: string) =>
  a.replace(/^0x/i, '').toLowerCase() === b.replace(/^0x/i, '').toLowerCase();
```

`send` is the whole write path: sign, submit, return the hash. The third argument to `signTransaction` is the part worth reading twice. The Hub is the untrusted party in this design, which is why it never holds a key, but that alone does not stop a compromised Hub from handing back a transaction with a different fare or a different reference and hoping you sign it blind. Passing `expected` makes the SDK compare type, fare, reference hash, sender, and chain id against what you asked for, and throw before signing if anything differs.

`until` is how the script stays honest about time. A submitted transaction is not state yet; it becomes state when a validator includes it, about a second later. Instead of sleeping and hoping, each step polls for the thing it needs to see before continuing. A real app would subscribe over WebSocket instead ([subscriptions](/clutch-hub-sdk-js/subscriptions)); polling keeps this file short.

## The ride

```ts
async function main() {
  const { passenger, driver } = loadWallets();
  const p = new ClutchHubSdk(API_URL, passenger.address, passenger.privateKey, CHAIN_ID);
  const d = new ClutchHubSdk(API_URL, driver.address, driver.privateKey, CHAIN_ID);

  // 1. Fund. Every CLT is minted against a USDT deposit; on stage that is Nile testnet USDT.
  const need = { passenger: FARE + 4n * TX_FEE, driver: TX_FEE };
  console.log(`passenger ${passenger.address}\n  send Nile USDT to ${await depositAddress(p)} (needs ${formatUsd(need.passenger)})`);
  console.log(`driver    ${driver.address}\n  send Nile USDT to ${await depositAddress(d)} (needs ${formatUsd(need.driver)})`);
  await until('passenger funded', async () => ((await p.getAccountBalance()) >= need.passenger ? true : undefined), 10_000, 3_600_000);
  await until('driver funded', async () => ((await d.getAccountBalance()) >= need.driver ? true : undefined), 10_000, 3_600_000);
  const before = { passenger: await p.getAccountBalance(), driver: await d.getAccountBalance() };

  // 2. Passenger asks for a ride.
  const requestTx = await send(p, passenger,
    await p.createUnsignedRideRequest({
      pickup: { latitude: 35.6892, longitude: 51.389 },
      dropoff: { latitude: 35.7219, longitude: 51.3347 },
      fare: FARE,
    }),
    { type: 'RideRequest', fare: FARE });
  await until('request on chain', async () =>
    (await d.listRideRequests()).find((r) => sameHash(r.txHash, requestTx)));

  // 3. Driver sees it and offers the asking fare.
  const offerTx = await send(d, driver,
    await d.createUnsignedRideOffer({ rideRequestTxHash: requestTx, fare: FARE }),
    { type: 'RideOffer', fare: FARE, refTxHash: requestTx });
  await until('offer on chain', async () =>
    (await p.listRideOffers(requestTx)).find((o) => sameHash(o.txHash, offerTx)));

  // 4. Passenger accepts. The full fare leaves the passenger now and is held for the trip.
  const acceptTx = await send(p, passenger,
    await p.createUnsignedRideAcceptance({ rideOfferTxHash: offerTx }),
    { type: 'RideAcceptance', refTxHash: offerTx });
  const myTrip = (t: { rideOfferTxHash: string }) => sameHash(t.rideOfferTxHash, offerTx);
  await until('trip active', async () =>
    (await p.listActiveTrips({ passengerAddress: passenger.address })).find(myTrip));

  // 5. Pay in two installments. Each RidePay pays the driver and the referrers at once.
  const half = FARE / 2n;
  await send(p, passenger,
    await p.createUnsignedRidePay({ rideAcceptanceTxHash: acceptTx, fare: half }),
    { type: 'RidePay', fare: half, refTxHash: acceptTx });
  await until('first installment settled', async () =>
    (await p.listActiveTrips({ passengerAddress: passenger.address })).find((t) => myTrip(t) && t.farePaid >= half));
  await send(p, passenger,
    await p.createUnsignedRidePay({ rideAcceptanceTxHash: acceptTx, fare: FARE - half }),
    { type: 'RidePay', fare: FARE - half, refTxHash: acceptTx });
  const trip = await until('trip completed', async () =>
    (await p.listCompletedTrips({ passengerAddress: passenger.address })).find(myTrip));

  // 6. Follow the money.
  const after = { passenger: await p.getAccountBalance(), driver: await d.getAccountBalance() };
  console.log(`trip ${trip.txHash}: paid ${formatUsd(trip.farePaid)} of ${formatUsd(trip.fare)}`);
  console.log(`passenger ${formatUsd(before.passenger)} -> ${formatUsd(after.passenger)}  (fare + 4 transaction fees)`);
  console.log(`driver    ${formatUsd(before.driver)} -> ${formatUsd(after.driver)}  (96% of the fare - 1 transaction fee)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

Six steps, and each one is a single transaction type:

- **Request.** The passenger names pickup, dropoff, and a fare. The driver's SDK polls `listRideRequests` until the request is on chain; in an app this is the map view.
- **Offer.** The driver references the request by hash and names a fare, here the asking fare. A request can collect several offers.
- **Acceptance.** The passenger picks an offer. This is the moment the full fare is debited from the passenger and held for the trip. If either side cancels before it is fully paid out, the unpaid part goes back to the passenger.
- **Pay, twice.** `RidePay` releases part of the held fare. Each installment is split by the node the moment it lands: the referrers take their share and the driver gets the exact remainder. The trip is complete when `farePaid` equals `fare`, at which point it leaves the active list and appears in the completed one.

## Follow the money

The stage Hub is configured with a referrer wallet on both the request and the offer side, at the default 2% each. So for a $5.00 fare:

| Account | Change | Why |
|---|---|---|
| Passenger | −$5.004 | the fare, plus four transactions at $0.001 |
| Driver | +$4.799 | 96% of $5.00, minus one transaction fee for the offer |
| Stage referrer | +$0.20 | 2% of each installment on the request side, 2% on the offer side |
| Block authors | +$0.005 | five transactions at $0.001 each |

`formatUsd` truncates to whole cents, so if you deposited 6 USDT to the passenger and 1 USDT to the driver, the last two lines of output read roughly `$6.00 -> $0.99` and `$1.00 -> $5.79`.

That 4% is the protocol's answer to "how does an app builder get paid". It goes to whoever runs the Hub the transactions came through. Run your own Hub with your wallet as the referrer and every ride through your app pays you the same way, with no grants program and nobody to ask. The [app developer incentives](/getting-started/app-developer-incentives) page has the config.

## Run it

```bash
npx tsx ride.ts
```

The first run prints two Tron addresses and waits:

```text
passenger 0x…
  send Nile USDT to T… (needs $5.00)
driver    0x…
  send Nile USDT to T… (needs $0.00)
```

Send at least 6 Nile USDT to the passenger's address and any amount to the driver's. The `$0.00` is `formatUsd` truncating 1,000 CLT; the driver needs one transaction fee, a tenth of a cent. Once the treasury credits both, the script runs the ride without further input and prints the trip and the balance changes. Paste any transaction hash into the [stage explorer](https://explorer-stage.clutchprotocol.io) to see the block it landed in.

Run it again and it reuses `wallets.json`, skips straight past funding, and runs another ride on the same wallets.

## What to read next

- [Ride lifecycle](/getting-started/ride-lifecycle) covers the two cancel paths this script skips, and the state machine behind them.
- [SDK API reference](/clutch-hub-sdk-js/api-reference) lists every builder and query, and explains the `chain_id` pinning and `verifyUnsignedTransaction` in full.
- [CLT economics](/clutch-node/clt-economics) is where the fee split, the flat transaction fee, and the reserve model are specified.
- [Quick Start](/getting-started/quickstart) runs the whole stack on your machine with Docker, if you would rather not depend on the stage testnet.

The full `ride.ts` is the four code blocks above, in order: about 125 lines including comments and blank lines, and every one of them runs on the client.
