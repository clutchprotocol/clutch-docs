---
sidebar_position: 3
---

# Architecture

## High-Level Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Demo App /    │     │  Clutch Hub API  │     │  Clutch Node    │
│   Your dApp     │────►│  (GraphQL/REST)  │────►│  (Blockchain)   │
│   + SDK         │     │                  │     │  WebSocket      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                          │                        │
        │ 1. Build unsigned tx     │ 2. Forward to node     │ 3. Validate
        │ 2. Sign client-side      │ 3. Return receipt      │    & mine
        │ 3. Submit signed tx      │                        │
```

## Component Roles

### Clutch Node
- **Consensus**: Aura
- **Transaction format**: Custom (non-EVM)
- **Exposes**: WebSocket (8081–8083), libp2p (4001–4003), Prometheus metrics (3001–3003)
- **Responsibilities**: Block production, transaction validation, state storage

### Clutch Hub API
- **Role**: Bridge between applications and the node
- **Exposes**: GraphQL at `/graphql`, REST at `/health`, `/auth/*`
- **Responsibilities**: Generate unsigned transactions, submit signed transactions, user authentication

### Clutch Hub SDK
- **Role**: Client-side signing and encoding
- **Responsibilities**: Encode transactions (RLP, Keccak256), sign with secp256k1, interact with API

## Security Model

- **Client-side signing**: Private keys never leave the user's device
- **Nonce/timestamp**: Prevents replay attacks
- **On-chain auditability**: All transactions recorded on the blockchain
