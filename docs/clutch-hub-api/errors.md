---
sidebar_position: 7
---

# GraphQL Error Catalog

The Hub API surfaces errors as standard GraphQL errors (`errors[]` with `message` and optional extensions). This page describes the common failure shapes so apps can branch on them reliably.

## Error envelope

```json
{
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": { "code": "UNAUTHENTICATED", ... }
    }
  ],
  "data": null
}
```

Apps should key off `extensions.code` (stable) rather than the human-readable `message` (may change).

## Authentication errors

| Code | Trigger | App action |
|------|---------|------------|
| `UNAUTHENTICATED` | Missing/invalid JWT on a protected field | Call `generateToken`, then retry |
| `INVALID_JWT` | Malformed or expired token | Re-authenticate |
| `INVALID_PUBLIC_KEY` | `generateToken` called with a bad public key | Validate key format before calling |
| — (`Proof of key ownership failed: …` message) | `generateToken` challenge rejected: timestamp outside the ±120s window or signature doesn't recover to the public key | Sync the client clock; re-sign the challenge with the correct private key |

Protected fields include all `createUnsigned*` mutations, `sendRawTransaction`, and `accountBalance` / `accountBalanceUpdated`.

## Node client errors

The Hub API forwards results from the node WebSocket JSON-RPC. Failures surface as:

| Code | Trigger |
|------|---------|
| `NODE_UNAVAILABLE` | Hub API could not reach the node (reconnecting) |
| `NODE_TIMEOUT` | Node RPC did not respond in time |
| `NODE_RPC_ERROR` | Node returned a JSON-RPC error (signature/nonce/balance) |
| `TX_REJECTED` | Node rejected the submitted transaction |

For `TX_REJECTED` / `NODE_RPC_ERROR`, re-fetch the nonce via the node (`get_next_nonce`) or via a fresh `createUnsigned*` call before retrying.

## Faucet errors

| Code | Trigger |
|------|---------|
| `FAUCET_DISABLED` | `faucet_enabled = false` on the Hub |
| `FAUCET_INVALID_ADDRESS` | Bad recipient address |
| `FAUCET_ERROR` | Faucet signing/submission failed |

Faucet abuse (rate limiting) is enforced at the reverse proxy in production and typically returns HTTP 429, not a GraphQL error. See [Security](/reference/security#faucet-abuse-controls).

## Input validation errors

| Code | Trigger |
|------|---------|
| `BAD_USER_INPUT` | Invalid coordinates, non-positive fare, malformed tx hash |
| `INVALID_MAP_BOUNDS` | `MapBoundsInput` min greater than max |

## Handling pattern (SDK / app)

```ts
const result = await sdk.createUnsignedRideRequest({...});
if (result.errors?.length) {
  const code = result.errors[0].extensions?.code;
  switch (code) {
    case 'UNAUTHENTICATED':
    case 'INVALID_JWT':
      await sdk.ensureAuth();
      return retry();
    case 'NODE_UNAVAILABLE':
    case 'NODE_TIMEOUT':
      await wait(500);
      return retry();
    case 'TX_REJECTED':
    case 'NODE_RPC_ERROR':
      // nonce may be stale — rebuild and re-sign
      return rebuildAndResubmit();
    default:
      throw result.errors[0];
  }
}
```

## Notes

- Error `extensions.code` values are stable across releases; `message` text is not
- GraphQL returns HTTP 200 for most errors; only transport-level failures use non-200
- Subscriptions emit errors on the same WebSocket stream — handle them in your subscription client

## Related

- [GraphQL Reference](/clutch-hub-api/graphql)
- [Authentication](/clutch-hub-api/authentication)
- [JSON-RPC Reference](/clutch-node/json-rpc)
- [Security](/reference/security)
