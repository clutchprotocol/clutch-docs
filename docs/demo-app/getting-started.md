---
sidebar_position: 2
---

# Demo App Getting Started

## Prerequisites

- Node.js 18+
- Running Clutch stack (clutch-deploy) or API at `http://localhost:3000`

## Setup

```bash
git clone https://github.com/clutchprotocol/clutch-hub-demo-app.git
cd clutch-hub-demo-app
npm install
npm run dev
```

Visit `http://localhost:5173`

## Configuration

Edit `src/config.js` to set the API URL:

```javascript
export const API_URL = 'http://localhost:3000';
```

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `clutchPublicKey` | User's public key |
| `clutchPrivateKey` | User's private key (if "remember keys" enabled) |
| `clutch_tx_[publicKey]` | Transaction history for user |

## Security Note

The demo optionally stores keys in localStorage for convenience. **Never do this in production.** Use hardware wallets or secure keystores instead.
