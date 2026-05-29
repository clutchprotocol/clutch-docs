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

## Images

| Registry | Image | Package page |
|----------|-------|--------------|
| GHCR | `ghcr.io/clutchprotocol/clutch-node:latest` | [clutch-node on GHCR](https://github.com/clutchprotocol/clutch-node/pkgs/container/clutch-node) |
| Docker Hub | `9194010019/clutch-node:latest` | [clutch-node on Docker Hub](https://hub.docker.com/r/9194010019/clutch-node) |

All published images: [Docker images reference](/reference/docker-images).
