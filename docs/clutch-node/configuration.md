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

# Consensus parameters — committed to state by the genesis ChainInit transaction.
# Must be byte-for-byte identical across every node (see below).
chain_id                          = 2077
is_testnet                        = true
tx_fee                            = 1000
mint_authority                    = "0x9b6e8af0c70..."
faucet_address                    = "0xdeb4cfb63db134698e1879ea24904df074726cc0"
faucet_allocation                 = 1000000000000000
ride_request_referrer_fee_bps    = 200
ride_offer_referrer_fee_bps      = 200

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
| `developer_mode` | **Deletes the on-disk database on every graceful shutdown** — see the danger note below | `true` in every shipped config |
| `websocket_addr` | WebSocket JSON-RPC bind | `0.0.0.0:8081` |
| `listen_addrs` | libp2p listen addresses | `["/ip4/0.0.0.0/tcp/4001"]` |
| `bootstrap_nodes` | Peers to dial on startup | `["/ip4/127.0.0.1/tcp/4001"]` (node2/3) |
| `authorities` | Ordered list of validator public keys | Must match across nodes |
| `block_authoring_enabled` | Whether this node runs the block-authoring job (participates as an active validator) | `true` |
| `chain_id` | Network identifier, signed into every transaction | `2077` |
| `is_testnet` | Gates faucet allocation and startup | `true` |
| `tx_fee` | Flat CLT fee per non-exempt transaction, paid to the block author | `1000` (= $0.001) |
| `mint_authority` | The only address permitted to sign a `Mint` transaction | validator or dedicated treasury key |
| `faucet_address` | Address the genesis faucet allocation is credited to | `0xdeb4cfb6...` |
| `faucet_allocation` | CLT credited to `faucet_address` at genesis, only if `is_testnet = true` | `1000000000000000` (= $1B) |
| `ride_request_referrer_fee_bps` | Request referrer fee on each `RidePay`, in basis points | `200` (2%) |
| `ride_offer_referrer_fee_bps` | Offer referrer fee on each `RidePay`, in basis points | `200` (2%) |
| `sync_enabled` | Whether this node runs the peer-sync job (pulls blocks from peers) | `true` |
| `serve_metric_enabled` | Whether the Prometheus `/metrics` endpoint is served at all | `true` |
| `serve_metric_addr` | Prometheus metrics bind | `0.0.0.0:3001` |
| `log_level` | Tracing log verbosity | `info` |
| `seq_url` | Seq logging URL | `http://seq:80` |

:::danger developer_mode deletes the database
`developer_mode = true` — the value in every shipped config, including `default.toml` — makes the node delete its entire on-disk database on every **graceful** shutdown (`shutdown_blockchain` → `cleanup_db` in `blockchain.rs`). That's the intended behavior for a scratch chain that starts fresh each run, and catastrophic for one whose data is meant to survive a restart: a month of stage outages were mistakenly blamed on volumes and the deploy script before anyone traced the actual cause to this flag.

The escape hatch is the `DB_PATH` environment variable: if it's set, the node treats that as a sign the data is meant to outlive the process, logs a warning, and **refuses to delete** rather than honoring `developer_mode`. Set `DB_PATH` (or `developer_mode = false`) before running against any volume whose contents you care about.
:::

:::danger block_reward_amount is removed
There is no `block_reward_amount` key anymore, and no CLT is minted per block. Validators are compensated from `tx_fee` revenue instead — see [CLT Economics](/clutch-node/clt-economics#validator-compensation-flat-transaction-fee). A config file left over from before this release that still sets `block_reward_amount` will simply have that key ignored; the node no longer reads it.
:::

## Consensus parameters must match across every node

`chain_id`, `is_testnet`, `tx_fee`, `mint_authority`, `faucet_address`, `faucet_allocation`, and the two referrer-fee bps rates are not just per-node preferences — they are written into the chain's state by a single `ChainInit` transaction (RLP tag 9) at block 0, and that transaction's hash feeds the genesis block hash. Peers compare genesis hashes during the p2p handshake: a node whose config produces a *different* genesis hash is refused outright, not silently allowed to fork.

Practically, this means:

- All three node TOMLs (`node1.toml`, `node2.toml`, `node3.toml`, and their `-docker` variants) must carry **identical** values for every consensus-parameter key above.
- Changing any of these values on an existing chain is equivalent to starting a new chain — the new genesis hash will not match any existing peer's, and no amount of retrying will make them sync.
- This is a deliberate fix: these parameters used to be per-node local config with no cross-node consistency check, which meant two misconfigured nodes could silently diverge instead of failing to connect. Now the failure is loud and immediate — a mismatched node simply never syncs.

## Key settings

- **Node 1 (bootstrap)**: leave `bootstrap_nodes = []`. It is the seed other nodes dial.
- **Node 2 / Node 3**: point `bootstrap_nodes` at node1. The checked-in `node2.toml` / `node3.toml` use `["/ip4/127.0.0.1/tcp/4001"]` for all three nodes on one host; the container variants `node2-docker.toml` / `node3-docker.toml` use `["/dns4/node1/tcp/4001"]` so Docker DNS resolves the peer.
- **`authorities` must be identical** on every node, in the same order. Aura schedules block authors by position in this list.
- **Validator keys**: generate a secp256k1 keypair per node. `author_public_key` goes in `authorities` for every node; `author_secret_key` stays on the node that authors.
- **`mint_authority`** does not need to be a validator key — a production deployment should use a dedicated treasury key from a proper key ceremony, never a validator's `author_secret_key`. The checked-in testnet config reuses node1's dev key purely for local convenience.
- **Genesis**: testnet genesis allocates `faucet_allocation` CLT to `faucet_address`, but only when `is_testnet = true` — on any other chain, faucet allocation is forced to zero regardless of what `faucet_allocation` says, and the node refuses to boot at all if `is_testnet = false` with a nonzero `faucet_allocation` configured. Do not change `blockchain_name` on a running chain — it would fork.
- **Secret management**: store `author_secret_key` via environment or a secret manager in production; never commit it to git.

## Multi-node checklist

- [ ] Same `authorities` list (same order) on all nodes
- [ ] Same `libp2p_topic_name` and `blockchain_name`
- [ ] Same `chain_id`, `is_testnet`, `tx_fee`, `mint_authority`, `faucet_address`, `faucet_allocation`, and both referrer-fee bps rates on all nodes — a mismatch here prevents peering entirely
- [ ] Node 1 has empty `bootstrap_nodes`; others point to node 1
- [ ] Distinct ports per node (8081/8082/8083, 4001/4002/4003, 3001/3002/3003)
- [ ] Validator secret keys kept out of source control

## Related

- [Running Clutch Node](/clutch-node/running)
- [Overview](/clutch-node/overview)
- [CLT Economics](/clutch-node/clt-economics) — the peg, fee model, and Mint/Burn
- [Transaction Types](/clutch-node/transaction-types)
