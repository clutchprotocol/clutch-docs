---
sidebar_position: 4
---

# GraphQL Error Catalog

The Hub API surfaces errors as standard GraphQL errors. Every error is constructed as a plain `async_graphql::Error::new(message)` — the API sets **no** `extensions` on any error, so there is no machine-readable error code to branch on. This page lists the actual message strings the API emits so apps know what to expect.

## Error envelope

```json
{
  "errors": [
    {
      "message": "Unauthorized: Authentication required",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["createUnsignedRideRequest"]
    }
  ],
  "data": null
}
```

:::warning No stable error codes
There is no `extensions.code` field. The only way to distinguish failures programmatically today is to match on `message` text, which is **fragile** — these strings are internal `format!` output and can change in any release without notice. Treat message matching as a stopgap: use it to decide between "retry" and "give up", and always keep a `default`/rethrow branch. Do not build user-facing logic that depends on an exact string.
:::

## Authentication errors

| Message | Trigger | App action |
|---------|---------|------------|
| `Unauthorized: Authentication required` | Missing, malformed, or expired JWT on a guarded field | Re-authenticate, then retry |
| `Proof of key ownership failed: challenge timestamp is outside the allowed ±120s window` | `generateToken` timestamp too far from server time | Sync the client clock and re-sign |
| `Proof of key ownership failed: signature does not match the provided public key` | Challenge signed with the wrong private key | Re-sign with the key matching `publicKey` |
| `Proof of key ownership failed: invalid challenge signature: …` | `r`/`s`/`v` unparseable or not recoverable | Check the signature encoding |
| `Proof of key ownership failed: Invalid public key length. Expected 40 or 130 characters, got …` | `publicKey` is neither a 20-byte address nor a 130-char uncompressed key | Validate key format before calling |
| `Proof of key ownership failed: Invalid hex format for public key: …` | `publicKey` contains non-hex characters | Validate key format before calling |
| `Failed to generate token: …` | JWT signing failed server-side | Retry; check API logs |

Guarded fields (those that can return `Unauthorized: Authentication required`) are all `createUnsigned*` mutations, `sendRawTransaction`, and the `accountBalance` and `userRideRequests` queries. Every subscription and every `list*` query is public — see [Authentication](/clutch-hub-api/authentication) for the full table.

An invalid token is **not** rejected at the transport level: the handler simply does not attach an authenticated user, so the request only fails if it reaches a guard.

## Node client errors

The Hub API forwards results from the node WebSocket JSON-RPC. The underlying client produces these messages:

| Message | Trigger |
|---------|---------|
| `WebSocket connection not established` | No live socket to the node (still connecting/reconnecting) |
| `Request timed out` | Node did not answer within the client's 10s timeout |
| `Connection lost before receiving response` | Socket dropped while the request was in flight |
| `Failed to send request: …` | Write to the node socket failed |
| `Failed to receive response` / `Mismatched response ID` / `No result or error in response` | Malformed or mismatched node reply |
| *(the node's own JSON-RPC error text, verbatim)* | Node returned a JSON-RPC error — e.g. bad signature, stale nonce, insufficient balance |

Resolvers wrap that text in a prefix identifying the operation, so the message you receive is nested:

- `Failed to get nonce: Failed to get nonce for address 0x…: Request timed out` — any `createUnsigned*` mutation
- `Failed to send transaction: …` — `sendRawTransaction`
- `Failed to get balance: Failed to get balance for address 0x…: …` — `accountBalance`
- The `list*` queries and subscriptions pass the node message through unwrapped.

When a transaction is rejected by the node, the nonce may be stale — re-fetch it with a fresh `createUnsigned*` call before retrying.

## Faucet errors

`POST /faucet` is plain REST, not GraphQL: it returns a `{"error": "…"}` JSON body with a real HTTP status, not a GraphQL `errors[]` array.

| Status | Message | Trigger |
|--------|---------|---------|
| 503 | `Faucet is disabled (set faucet_enabled = true in config for test networks)` | `faucet_enabled = false` |
| 503 | `Faucet is not configured (set faucet_private_key to a funded account private key)` | `faucet_private_key` empty |
| 400 | `Invalid public key length. Expected 40 or 130 characters, got …` | Malformed recipient address |
| 429 | `faucet cooldown active, try again later` (plus `retry_after_secs`) | Rate limit hit |
| 400 | `faucet account 0x… has insufficient balance (have N, need M)` | Faucet account underfunded in genesis |
| 400 | `node rejected faucet tx: …` | Node unreachable or rejected the transfer |

Rate limiting **is** built in: the Hub enforces a 30-second cooldown per client IP and a 1-hour cooldown per recipient address, returning HTTP 429 with a `Retry-After` header. See [Faucet](/clutch-hub-api/faucet) for details, and [Security](/reference/security#faucet-abuse-controls) for additional proxy-level hardening on public testnets.

## Input validation errors

The API does almost no hand-written input validation — argument types are enforced by the GraphQL schema itself, and malformed queries fail async-graphql's own parsing/validation before any resolver runs. The only explicit check in a resolver is:

| Message | Trigger |
|---------|---------|
| `fare must be positive` | `createUnsignedRidePay` called with `fare <= 0` |

Coordinates, map bounds, and transaction hashes are **not** validated by the Hub API. Bad values are forwarded to the node, which rejects them — so those failures arrive as [node client errors](#node-client-errors).

## Handling pattern (SDK / app)

The SDK **throws** on GraphQL errors (its internal `executeGraphQL` joins all `errors[].message` values with newlines into a single `Error`), so use `try`/`catch` rather than inspecting a result object:

```ts
try {
  const unsigned = await sdk.createUnsignedRideRequest({ pickup, dropoff, fare });
  const { rawTransaction } = await sdk.signTransaction(unsigned, privateKey);
  return await sdk.submitTransaction(rawTransaction);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);

  // Fragile: message matching is the only option — there are no error codes.
  if (message.includes('Unauthorized: Authentication required')) {
    sdk.setPrivateKey(privateKey); // SDK re-runs generateToken on the next call
    return retry();
  }
  if (
    message.includes('Request timed out') ||
    message.includes('WebSocket connection not established') ||
    message.includes('Connection lost')
  ) {
    await wait(500);
    return retry();
  }
  if (message.includes('Failed to get nonce') || message.includes('Failed to send transaction')) {
    // nonce may be stale — rebuild from a fresh createUnsigned* call and re-sign
    return rebuildAndResubmit();
  }
  throw err;
}
```

Authentication is handled inside the SDK — `ensureAuth()` is private and runs automatically before every authenticated call. There is no public method to force a token refresh; supplying the private key (constructor or `setPrivateKey`) is what lets the SDK issue one.

## Notes

- Error messages are **not** stable across releases, and there are no error codes — see the warning above
- GraphQL returns HTTP 200 for resolver errors; `POST /faucet` uses real status codes (400/429/503)
- Subscriptions emit errors on the same WebSocket stream — handle them in your subscription client. Because the polling loops re-query the node each tick, a transient node failure surfaces as one error payload and the stream keeps running.

## Related

- [GraphQL Reference](/clutch-hub-api/graphql)
- [Authentication](/clutch-hub-api/authentication)
- [JSON-RPC Reference](/clutch-node/json-rpc)
- [Security](/reference/security)
