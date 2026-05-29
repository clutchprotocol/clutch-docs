---
sidebar_position: 2
---

# Node Configuration

Node configs: `config/node/node1.toml`, `node2.toml`, `node3.toml`.

## Key Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `libp2p_topic_name` | Network topic | `test-net` |
| `blockchain_name` | Chain identifier | `clutch-node-test-1` |
| `author_public_key` | Validator public key | `0x9b6e8af...` |
| `author_secret_key` | Validator secret (keep secure) | — |
| `websocket_addr` | WebSocket bind | `0.0.0.0:8081` |
| `listen_addrs` | libp2p listen | `["/ip4/0.0.0.0/tcp/4001"]` |
| `bootstrap_nodes` | Peers to connect to | `["/dns4/node1/tcp/4001"]` (node2/3) |
| `authorities` | List of validator public keys | Must match across nodes |
| `block_reward_amount` | CLT minted to block author per non-genesis block | `50` |
| `ride_request_referrer_fee_percent` | Request referrer fee on each `RidePay` | `2` |
| `ride_offer_referrer_fee_percent` | Offer referrer fee on each `RidePay` | `2` |
| `serve_metric_addr` | Prometheus metrics | `0.0.0.0:3001` |
| `seq_url` | Seq logging URL | `http://seq:80` |

## Bootstrap

- **Node 1**: `bootstrap_nodes = []` (it is the bootstrap)
- **Node 2, 3**: `bootstrap_nodes = ["/dns4/node1/tcp/4001"]`

## Multi-Node

All nodes must share the same `authorities` and `libp2p_topic_name`.

See [CLT Economics](/clutch-node/clt-economics) for how referrer fees and block rewards interact.
