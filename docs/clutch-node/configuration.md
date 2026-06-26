---
sidebar_position: 2
---

# Node Configuration

Node configs live in `config/node/node1.toml`, `node2.toml`, `node3.toml`. Each file configures one validator.

## Full example

```toml
# Identity / network
blockchain_name        = "clutch-node-test-1"
libp2p_topic_name      = "test-net"

# Validator keys (keep secret_key secure — never commit)
author_public_key      = "0x9b6e8af0c70..."
author_secret_key      = "0x<validator-private-key>"

# All validator public keys — must match across every node
authorities            = [
  "0x9b6e8af0c70...",
  "0x<validator-2-pubkey>",
  "0x<validator-3-pubkey>",
]

# Networking
websocket_addr         = "0.0.0.0:8081"
listen_addrs           = ["/ip4/0.0.0.0/tcp/4001"]
bootstrap_nodes        = []  # node1 is the bootstrap; node2/3 set ["..."]

# Economics
block_reward_amount                = 50
ride_request_referrer_fee_percent = 2
ride_offer_referrer_fee_percent   = 2

# Observability
serve_metric_addr      = "0.0.0.0:3001"
seq_url                = "http://seq:80"
```

## Key settings

| Setting | Description | Example |
|---------|-------------|---------|
| `libp2p_topic_name` | Network gossip topic | `test-net` |
| `blockchain_name` | Chain identifier | `clutch-node-test-1` |
| `author_public_key` | Validator public key | `0x9b6e8af...` |
| `author_secret_key` | Validator secret (keep secure) | — |
| `websocket_addr` | WebSocket JSON-RPC bind | `0.0.0.0:8081` |
| `listen_addrs` | libp2p listen addresses | `["/ip4/0.0.0.0/tcp/4001"]` |
| `bootstrap_nodes` | Peers to dial on startup | `["/dns4/node1/tcp/4001"]` (node2/3) |
| `authorities` | Ordered list of validator public keys | Must match across nodes |
| `block_reward_amount` | CLT minted to block author per non-genesis block | `50` |
| `ride_request_referrer_fee_percent` | Request referrer fee on each `RidePay` | `2` |
| `ride_offer_referrer_fee_percent` | Offer referrer fee on each `RidePay` | `2` |
| `serve_metric_addr` | Prometheus metrics bind | `0.0.0.0:3001` |
| `seq_url` | Seq logging URL | `http://seq:80` |

## Validator and bootstrap guidance

- **Node 1 (bootstrap)**: leave `bootstrap_nodes = []`. It is the seed other nodes dial.
- **Node 2 / Node 3**: set `bootstrap_nodes = ["/dns4/node1/tcp/4001"]` (or the multiaddr that resolves to node1).
- **`authorities` must be identical** on every node, in the same order. Aura schedules block authors by position in this list.
- **Validator keys**: generate a secp256k1 keypair per node. `author_public_key` goes in `authorities` for every node; `author_secret_key` stays on the node that authors.
- **Genesis**: testnet genesis allocates the faucet account supply. Do not change `blockchain_name` on a running chain — it would fork.
- **Secret management**: store `author_secret_key` via environment or a secret manager in production; never commit it to git.

## Multi-node checklist

- [ ] Same `authorities` list (same order) on all nodes
- [ ] Same `libp2p_topic_name` and `blockchain_name`
- [ ] Node 1 has empty `bootstrap_nodes`; others point to node 1
- [ ] Distinct ports per node (8081/8082/8083, 4001/4002/4003, 3001/3002/3003)
- [ ] Validator secret keys kept out of source control

## Related

- [Running Clutch Node](/clutch-node/running)
- [Overview](/clutch-node/overview)
- [CLT Economics](/clutch-node/clt-economics) — how referrer fees and block rewards interact
- [Transaction Types](/clutch-node/transaction-types)
