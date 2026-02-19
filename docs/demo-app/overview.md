---
sidebar_position: 1
---

# Demo App Overview

The **Clutch Hub Demo App** is a React + Vite application that demonstrates blockchain-based ride-sharing using the Clutch Hub SDK.

## Features

- **User profile** — Store public/private keys (optional localStorage)
- **Ride request** — Interactive map (Leaflet) for pickup/dropoff, fare input
- **Transaction signing** — Client-side signing when keys are stored
- **Transaction history** — Persistent list per public key

## Tech Stack

- React
- Vite
- Leaflet (maps)
- clutch-hub-sdk-js

## Key Concepts Demonstrated

1. **User sovereignty** — Users own and control their keys
2. **Client-side signing** — Keys never leave the browser
3. **Transparency** — Transaction history visible on-chain
4. **Trustless operations** — No central authority for ride processing
