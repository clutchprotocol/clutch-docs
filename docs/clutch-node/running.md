---
sidebar_position: 3
---

# Running Clutch Node

## Docker (Recommended)

### Single Node
```bash
docker pull ghcr.io/clutchprotocol/clutch-node:latest
docker run --rm -p 8081:8081 -p 4001:4001 -p 3001:3001 \
  -v $(pwd)/config:/app/config:ro \
  ghcr.io/clutchprotocol/clutch-node:latest --env node1
```

### With Docker Compose
Use [clutch-deploy](https://github.com/clutchprotocol/clutch-deploy) for the full stack, or the [clutch-node](https://github.com/clutchprotocol/clutch-node) repo for nodes only:

```bash
cd clutch-node
docker-compose up -d
```

## Local Development (Rust)

```bash
git clone https://github.com/clutchprotocol/clutch-node.git
cd clutch-node
cargo run -- --env node1
```

### Windows: Clang
Set `LIBCLANG_PATH` if required:
```powershell
$env:LIBCLANG_PATH = "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\Llvm\x64\bin"
```

## Multiple Nodes

- **Node 1** (bootstrap): No `bootstrap_nodes`
- **Node 2, 3**: `bootstrap_nodes = ["/dns4/node1/tcp/4001"]`
- Ensure all nodes share the same `authorities` list

## When a node won't sync

Check these in order — the first two cause a peer to be refused outright rather than a node falling gradually behind, so they're the likely cause whenever a node has never synced at all rather than just lagging:

1. **Genesis hash mismatch.** `chain_id`, `is_testnet`, `tx_fee`, `mint_authority`, `faucet_address`, `faucet_allocation`, and both referrer-fee bps rates are committed into the genesis block by `ChainInit` — if even one differs between two nodes, they compute different genesis hashes, and each refuses the other's p2p handshake rather than risk a silent fork. The refusal is logged on the *rejecting* node (`refusing peer ...: genesis hash mismatch`) — nothing surfaces it anywhere a caller would see it, not in RPC, not in the explorer, not in the demo app. Diff every consensus-parameter key across all node configs; see [Configuration — Consensus parameters must match across every node](/clutch-node/configuration#consensus-parameters-must-match-across-every-node).
2. **`authorities` list differs, including order.** Aura picks each slot's author as `authorities[slot % authorities.len()]`, so the same keys in a different order schedule different authors — and since `authorities` also feeds `ChainInit`, a reordering changes the genesis hash too, which fails as case 1.
3. **It's behind, not broken.** Call `get_chain_info` and read `is_syncing` and `blocks_behind` rather than judging from `latest_block_index` alone — a node answers RPC normally while still catching up, and its own `latest_block_index` doesn't say whether that's the tip. See [JSON-RPC — get_chain_info](/clutch-node/json-rpc#get_chain_info).

None of this is instant even when every config agrees: block time is derived, not configured — `60 / authorities.len()` seconds per slot, so **20 seconds** with the standard three-authority setup, because Aura divides one minute into as many slots as there are validators rather than reading a slot-duration setting. A node that looks stuck for less than that is just waiting for its next slot.

## Images

| Registry | Image | Package page |
|----------|-------|--------------|
| GHCR | `ghcr.io/clutchprotocol/clutch-node:latest` | [clutch-node on GHCR](https://github.com/clutchprotocol/clutch-node/pkgs/container/clutch-node) |
| Docker Hub | `9194010019/clutch-node:latest` | [clutch-node on Docker Hub](https://hub.docker.com/r/9194010019/clutch-node) |

All published images: [Docker images reference](/reference/docker-images).
