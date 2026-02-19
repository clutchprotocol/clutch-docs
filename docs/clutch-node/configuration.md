---
sidebar_position: 2
---

# Node Configuration

Node configs live in `config/node/` as TOML files: `node1.toml`, `node2.toml`, `node3.toml`.

## Key Settings

- **serve_metric_addr** — Prometheus metrics bind address (e.g. `0.0.0.0:3001`)
- **bootstrap_peers** — For node2/node3: `/dns4/node1/tcp/4001`

## Running Locally

```bash
# From clutch-node repo
cargo run -- --env node1
```

Or use [clutch-deploy](https://github.com/clutchprotocol/clutch-deploy) for the full stack.
