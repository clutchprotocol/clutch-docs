---
sidebar_position: 2
---

# Transaction Flow

## Ride Request Flow

```
1. User selects pickup/dropoff and fare in the app
2. App calls SDK: createUnsignedRideRequest({ pickup, dropoff, fare })
3. SDK calls API: GraphQL mutation createUnsignedRideRequest
4. API generates unsigned transaction, returns to SDK
5. SDK encodes payload (RLP, Keccak256)
6. User signs with private key (client-side)
7. SDK calls API: submitSignedTransaction(signedTx)
8. API forwards to Clutch Node via WebSocket
9. Node validates, includes in block, returns receipt
10. API returns receipt to app
```

## Data Flow

```
App ──► SDK ──► API ──► Node (WebSocket)
                ▲
                │ GraphQL + REST
```
