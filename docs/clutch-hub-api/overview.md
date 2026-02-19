---
sidebar_position: 1
---

# Clutch Hub API Overview

Clutch Hub API bridges applications to the Clutch Node blockchain. It exposes GraphQL and REST endpoints for transaction creation, submission, and user management.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/graphql` | POST | GraphQL API |
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login |
| `/users` | GET, POST | User CRUD |

## Features

- User authentication (JWT)
- Unsigned transaction generation
- Signed transaction submission
- GraphQL for flexible queries
- Seq integration for structured logging

## Docker

```bash
docker pull 9194010019/clutch-hub-api:latest
docker run -p 3000:3000 -v $(pwd)/config:/app/config:ro 9194010019/clutch-hub-api:latest
```

Or use [clutch-deploy](https://github.com/clutchprotocol/clutch-deploy) for the full stack.
