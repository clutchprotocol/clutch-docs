---
sidebar_position: 3
---

# GraphQL API

The API exposes GraphQL at `POST /graphql`.

## Example

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

## Mutations

### createUnsignedRideRequest

Creates an unsigned ride request transaction.

```graphql
mutation CreateUnsignedRideRequest(
  $pickupLatitude: Float!, $pickupLongitude: Float!,
  $dropoffLatitude: Float!, $dropoffLongitude: Float!, $fare: Int!
) {
  createUnsignedRideRequest(
    pickupLatitude: $pickupLatitude,
    pickupLongitude: $pickupLongitude,
    dropoffLatitude: $dropoffLatitude,
    dropoffLongitude: $dropoffLongitude,
    fare: $fare
  ) {
    data
    from
    nonce
  }
}
```

### submitSignedTransaction

Submits a signed transaction.

```graphql
mutation SubmitSignedTransaction($input: SignedTransactionInput!) {
  submitSignedTransaction(input: $input) {
    txHash
    status
  }
}
```

### generateToken

Generates a JWT for API access (used by SDK).

```graphql
mutation GenerateToken($publicKey: String!) {
  generateToken(publicKey: $publicKey) {
    token
    expiresAt
  }
}
```

## Authentication

For protected mutations, include the JWT:

```
Authorization: Bearer <token>
```
