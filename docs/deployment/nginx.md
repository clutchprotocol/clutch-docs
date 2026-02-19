---
sidebar_position: 3
---

# Nginx Reverse Proxy

Enable Nginx when running clutch-deploy:

```bash
docker compose --profile proxy up -d
```

## Routes

| Path | Backend |
|------|---------|
| `/health` | clutch-hub-api:3000/health |
| `/graphql` | clutch-hub-api:3000/graphql |
| `/api/` | clutch-hub-api:3000/ |
| `/` | clutch-hub-api:3000/ |

## Config

`config/nginx/nginx.conf` — edit for custom server names or SSL.
