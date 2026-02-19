---
sidebar_position: 2
---

# Installation

## npm

```bash
npm install clutch-hub-sdk-js
```

## Version Strategies

| Use Case | Package Spec | Example |
|----------|--------------|---------|
| **Production** | Pinned version | `"1.3.1"` |
| **Development** | Caret range | `"^1.3.0"` |
| **Staging** | Tilde range | `"~1.3.1"` |
| **Canary** | Tag | `@canary` |

```bash
# Install specific version
npm install clutch-hub-sdk-js@1.3.1

# Install canary (bleeding edge)
npm install clutch-hub-sdk-js@canary

# Check available versions
npm view clutch-hub-sdk-js versions --json
```

## Requirements

- Node.js 18+
- ES2020+ (BigInt support)
