---
sidebar_position: 2
---

# Installation

## npm

```bash
npm install clutch-hub-sdk-js
```

## Version strategies

| Use case | Package spec | Example |
|----------|--------------|---------|
| Production | Pinned version | `"3.0.0"` |
| Development | Caret range | `"^3.0.0"` |
| Canary | Tag | `@canary` |

Upgrading from a `1.x` or `2.x` install is not a drop-in bump — see [v3 breaking changes](/clutch-hub-sdk-js/api-reference#v3-breaking-changes) first.

```bash
# Install latest
npm install clutch-hub-sdk-js

# Install canary (bleeding edge)
npm install clutch-hub-sdk-js@canary

# Check available versions
npm view clutch-hub-sdk-js versions --json
```

## Requirements

- Node.js 18+ (20+ recommended)
- ES2020+ (BigInt support)
- Browser or Node.js environment with `fetch` / axios support

## Constructor

The first two arguments are required; `privateKey` and `chainId` are optional:

```typescript
new ClutchHubSdk(apiUrl: string, publicKey: string, privateKey?: string, chainId?: number)
```

`chainId` is new in v3 — see [v3 breaking changes](/clutch-hub-sdk-js/api-reference#v3-breaking-changes). Pin it to your own app config; the SDK never reads it back from the hub. Omitting it still works for read-only queries, but you lose the ability to verify a hub-returned transaction before signing it.

The SDK automatically obtains a JWT via `generateToken` when calling authenticated methods. `generateToken` requires a signed proof-of-key-ownership challenge, so pass the wallet's private key (or call `setPrivateKey` later) before using authenticated methods; it stays local and is never sent to the API.

## Next steps

- [Usage](/clutch-hub-sdk-js/usage)
- [Ride Lifecycle](/getting-started/ride-lifecycle)
