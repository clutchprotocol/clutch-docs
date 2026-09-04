---
sidebar_position: 3
---

# Architecture

## High-Level Flow

```mermaid
flowchart LR
    App["Demo App / Your dApp + SDK"] -->|"1. build unsigned tx"| Hub["Clutch Hub API (GraphQL/WS + /faucet)"]
    App -->|"2. sign client-side"| App
    App -->|"3. submit signed tx"| Hub
    Hub -->|"forward to node"| Node["Clutch Node (Blockchain, WebSocket RPC)"]
    Node -->|"validate & mine"| Node
    Node -->|"index blocks/txs"| Explorer["Clutch Explorer (indexer + UI)"]
```

### Transaction steps

1. **Build unsigned tx** — the app asks the Hub API for an unsigned transaction payload
2. **Sign client-side** — the user signs the hash locally with their private key (keys never sent to server)
3. **Submit signed tx** — the app sends the signed RLP hex to the Hub, which forwards it to the node
4. **Validate & mine** — the node verifies signature/nonce, applies it to state, and includes it in a block

## Deposit Flow

Turning USDT into CLT is a second, independent way into the chain — it does not join the flow above at any point:

```mermaid
flowchart LR
    Browser["Demo App / Your dApp"] -->|"1. POST/GET /api/v1/deposits"| Orch["payment-orchestrator"]
    Orch -->|"2. deposit evidence: address, amount, tx id"| Treasury["treasury-service"]
    Treasury -->|"3. send_raw_transaction (Mint)"| Node["Clutch Node"]
```

This flow deliberately bypasses the Hub API and the SDK on both legs: the browser calls `payment-orchestrator` directly rather than asking the Hub for an unsigned transaction, because a deposit address and Tron-side detection have nothing to do with the Clutch chain's transaction format; and `treasury-service`, once a deposit is approved, submits the resulting `Mint` straight to the node's own WebSocket RPC (`send_raw_transaction`) rather than through the Hub. The only thing the two paths share is identity — the orchestrator accepts the same Hub-issued JWT the SDK already holds, because both services check it against the same secret. Once the `Mint` lands, the CLT it created is ordinary chain state, indistinguishable from CLT that arrived any other way. See [Clutch Treasury Overview](/clutch-treasury/overview) for the three services behind this box and [Deposits](/clutch-treasury/deposits) for what a depositor actually sees.

## Component Roles

### Clutch Node

- **Consensus**: Aura round-robin over configured validators
- **Transaction format**: Custom RLP-encoded function calls (non-EVM)
- **Exposes**: WebSocket JSON-RPC (8081–8083), libp2p (4001–4003), Prometheus (3001–3003)
- **Responsibilities**: Block production, transaction validation, ride state machine

### Clutch Hub API

- **Role**: Bridge between applications and the node
- **Exposes**: GraphQL at `/graphql`, subscriptions at `/graphql/ws`, faucet at `/faucet`, health at `/health`
- **Responsibilities**: Build unsigned transactions, submit signed transactions, wallet JWT auth, poll-based subscriptions

### Clutch Hub SDK

- **Role**: Client-side signing and API integration
- **Responsibilities**: RLP encoding, Keccak-256 hashing, secp256k1 signing, GraphQL queries/subscriptions

### Clutch Explorer

- **Role**: Read-only chain indexer and block explorer
- **Exposes**: REST API (8088), React UI (5174)
- **Responsibilities**: Index blocks/transactions into Postgres, serve search and account history

## Security Model

- **Client-side signing**: Private keys never leave the user's device
- **Wallet JWT**: Public key identity — no username/password
- **Nonce**: Prevents replay attacks per account
- **On-chain auditability**: All transactions recorded on the blockchain

## Real-time data

Apps receive live updates via GraphQL subscriptions. The API polls the node and pushes snapshots (~1s for trips, ~0.5s for offers). The SDK multiplexes subscriptions over a shared WebSocket.

## Related

- [Ride Lifecycle](/getting-started/ride-lifecycle)
- [Transaction Flow](/reference/transaction-flow)
- [Environments](/getting-started/environments)
- [Deposits](/clutch-treasury/deposits) — the treasury side of the deposit flow above
- [Clutch Treasury Overview](/clutch-treasury/overview)
