---
sidebar_position: 2
---

# Authentication

## REST Endpoints

### POST /auth/register

Register a new user.

**Request:**
```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "token": "string"
}
```

### POST /auth/login

Log in a user.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string"
}
```

## Using the Token

For protected endpoints, include the JWT in the header:

```
Authorization: Bearer <token>
```

## GraphQL Authentication

The SDK uses `generateToken` mutation with `publicKey` for API access. No username/password required for blockchain operations.
