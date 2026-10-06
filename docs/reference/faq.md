---
sidebar_position: 6
---

# FAQ

## General

**What is Clutch Protocol?**  
A decentralized ride-sharing blockchain with on-chain ride lifecycle, client-side signing, and CLT payments. CLT is a fully-reserved, redeemable token (1 USD = 1,000,000 CLT) — referrer fees on RidePay go to app builders, and validators are compensated by a flat per-transaction fee rather than block rewards.

**What is CLT and why does it have no decimals?**  
CLT is pegged 1 USD = 1,000,000 CLT, making CLT itself the smallest unit (a micro-dollar) — there's nothing smaller to express as a decimal. Every CLT in circulation is backed 1:1 by off-chain reserve; the only operations that change total supply are the authority-gated `Mint` and the permissionless `Burn`. See [CLT Economics](/clutch-node/clt-economics).

**Is it production-ready?**  
No. Alpha/experimental. APIs may change without notice. The mainnet is a capped pilot, not a production launch: see the next question.

**Is there a mainnet?**  
Yes, as a capped pilot. Chain `1000` is running with three validators and has been open to every account since 2026-10-05. You get CLT by topping up with USDT (TRC-20 on Tron): at most $100 per top-up and $200 per day, and network fees apply. Withdrawals are not open yet. The pilot is alpha software with real money: the three validators run on one host, the treasury's mint and payout keys are plain keys on the server, and nothing has been audited. Use only what you can afford to lose. See [Environments](/getting-started/environments) for the addresses and [Mainnet Readiness](/reference/mainnet-readiness) for what stands between the pilot and a production mainnet.

**Why is a fee taken from my top-up, and is any of it refunded?**  
The USDT in your deposit address is moved out by a relay, and the relay charges a fee in USDT. The treasury takes that fee from your top-up: $4.00 the first time and $2.00 after, on the mainnet pilot. It takes the maximum the relay is allowed to charge, because the treasury must be sure that the reserve covers the CLT it mints even if the relay raises its price. The relay's real fee is lower today ($3.00 and $1.50). The difference is not refunded. It stays in the reserve as extra backing, and the treasury uses it for its own network costs, such as the one-time setup of its payout wallet. The app shows the fee before you pay. See [Deposits](/clutch-treasury/deposits).

**Why can't I withdraw on the mainnet yet?**  
A withdrawal (a redemption) is paid from the treasury's payout wallet, and that wallet has to be activated once before it can send its first payment. The activation needs a small surplus in the reserve, which builds up from the first top-ups. Until it has happened, the treasury refuses to start a redemption, before anything is burned, so nobody loses CLT by trying. See [Redemptions](/clutch-treasury/redemptions).

**Is there a DAO / governance?**  
Described on the marketing site as roadmap. Not implemented in the current codebase.

## Deployment

**Why is /health not working?**  
Ensure `ws_addr = "0.0.0.0:3000"` in API config and port 3000 is mapped in Docker.

**Port conflicts?**  
Grafana uses 3030 to avoid clash with API on 3000. Explorer frontend uses 5174 (demo uses 5173).

**How do I reset the chain?**  
`docker compose down -v && docker compose up -d` in clutch-deploy.

## Authentication

**How do I authenticate?**  
Call GraphQL `generateToken(publicKey, timestamp, signature)`, where `signature` is a secp256k1 signature over the challenge `clutch-auth:{chain_id}:{publicKey}:{timestamp}` proving you hold the private key. No username/password. The SDK does this automatically when given the private key, or a signer for the user's wallet, and a `chainId` at construction.

**Which wallets work?**  
Any wallet that can sign a message with `personal_sign`: MetaMask and Trust Wallet are the ones the demo app is built and tested for. A Clutch account is an Ethereum-type account (secp256k1; the address is the last 20 bytes of Keccak-256 of the public key), so the address of a MetaMask or Trust Wallet account is a valid Clutch address. The wallet is only a signer. Clutch is not an EVM network, so you do not add it to the wallet as a network and the wallet does not show your CLT balance. See [SDK Usage — Use a wallet](/clutch-hub-sdk-js/usage#use-a-wallet-metamask-trust-wallet).

**What does my wallet show when I approve something?**  
A short text, not the ride: `clutch-auth:…` to sign in (once per session) and `clutch-tx:{chain_id}:{hash}` for a transaction. The demo app tells you what each prompt is for before it opens. Only approve a `clutch-tx:` text that an app you trust asked for just now.

**Can I connect a wallet on my phone to the app on my computer?**  
Not yet (WalletConnect is not built). On a phone, open the app inside the wallet app's own browser, or use the extension on a computer.

**Do subscriptions need auth?**  
Public list subscriptions work without JWT. `accountBalance` and mutations require JWT.

## SDK

**Which npm package?**  
[`clutch-hub-sdk-js`](https://www.npmjs.com/package/clutch-hub-sdk-js)

**How do I get a nonce?**  
The API fetches it from the node when you call `createUnsigned*`. You do not call the node directly.

**submitSignedTransaction vs submitTransaction?**  
Use `submitTransaction(rawTransaction)` — the old method name is deprecated.

**Why is `fare`/`amount` a `bigint` now?**  
A `number` silently loses precision above `2^53`, which is a reachable CLT amount at this release's peg — not a theoretical edge case. Pass `5_000_000n`, not `5000000`, and format for display with `formatUsd()`.

**What does `verifyUnsignedTransaction` protect against?**  
It checks a hub-returned unsigned transaction (type, fare/amount, references, `from`, and `chain_id` pinned from your own app config) before you sign it, closing the gap where the SDK previously signed whatever the hub returned without checking it matched what you asked for. Pass it as `signTransaction`'s third argument. It cannot verify the `referrer` field — the hub injects that server-side with no signed-quote mechanism yet, so it's surfaced for display only.

## Getting CLT

**How do I get CLT?**  
Deposit USDT. Every wallet has one permanent Tron address; send USDT (TRC-20) to it and the treasury mints the matching CLT to that wallet. In the demo app that's ☰ → **Wallet** → **Top up**. See [Deposits](/clutch-treasury/deposits).

**There used to be a faucet — where did it go?**  
Gone, in two stages. First the endpoint: `POST /faucet` and the SDK's `requestFaucet()` were removed, because the faucet *transferred* CLT out of a genesis-funded account rather than minting it, so what it handed out had no USDT behind it and was excluded from reserve liability by construction. That was harmless while CLT only ever flowed one way. Redemptions went live on 2026-09-04, and nothing in the burn path asks where burned CLT came from — which turned that account into a route from unbacked genesis CLT to real USDT out of the payout float.

Then the balance, which was always the part that mattered: removing the endpoint never removed the CLT, and the route needed only the key, not the endpoint. `faucet_allocation` went to `0` on 2026-09-05, which took a chain reset because genesis values are committed into the genesis hash. Genesis now pre-mints nothing and CLT is obtained by [depositing USDT](/clutch-treasury/deposits).

**How much USDT do I need to deposit?**  
Whatever you want. There is no minimum, no expected amount, and no expiry — the address alone identifies who paid, and whatever lands is credited in full at the peg (1 USD = 1,000,000 CLT). See [Deposits](/clutch-treasury/deposits).

## Explorer

**Hub API vs Explorer?**  
Hub API is for building apps (GraphQL, write txs). Explorer is for browsing chain history (REST, read-only).

**Why is my transaction not in the explorer yet?**  
Indexer polls every ~4 seconds. Wait and refresh.

## Stage URLs

| Service | URL |
|---------|-----|
| Demo | https://app-stage.clutchprotocol.io |
| API | https://api-stage.clutchprotocol.io |
| Node 1 | wss://node1-stage.clutchprotocol.io/ws |

## Docker images

See the full [Docker images reference](/reference/docker-images) for registry links and pull commands.

| Component | GHCR |
|-----------|------|
| Node | [`ghcr.io/clutchprotocol/clutch-node`](https://github.com/clutchprotocol/clutch-node/pkgs/container/clutch-node) |
| Hub API | [`ghcr.io/clutchprotocol/clutch-hub-api`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-hub-api) |
| Demo app | [`ghcr.io/clutchprotocol/clutch-hub-demo-app`](https://github.com/orgs/clutchprotocol/packages/container/package/clutch-hub-demo-app) |
| Explorer | [`clutch-explorer-backend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-backend), [`clutch-explorer-frontend`](https://github.com/clutchprotocol/clutch-explorer/pkgs/container/clutch-explorer-frontend) |

## Documentation

Full docs: https://docs.clutchprotocol.io
