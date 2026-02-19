---
sidebar_position: 2
---

# GraphQL API

The API exposes a GraphQL endpoint at `POST /graphql`.

## Example

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

## Authentication

For protected operations, include the JWT token:

```
Authorization: Bearer <token>
```

See [Clutch Hub API README](https://github.com/clutchprotocol/clutch-hub-api) for auth endpoints (`/auth/register`, `/auth/login`).
