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
| Production | Pinned version | `"1.22.1"` |
| Development | Caret range | `"^1.22.0"` |
| Canary | Tag | `@canary` |

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

The first two arguments are required:

```typescript
new ClutchHubSdk(apiUrl: string, publicKey: string, privateKey?: string)
```

The SDK automatically obtains a JWT via `generateToken` when calling authenticated methods. `generateToken` requires a signed proof-of-key-ownership challenge, so pass the wallet's private key (or call `setPrivateKey` later) before using authenticated methods; it stays local and is never sent to the API.

## Next steps

- [Usage](/clutch-hub-sdk-js/usage)
- [Ride Lifecycle](/getting-started/ride-lifecycle)
