---
sidebar_position: 3
---

# Nginx Reverse Proxy

Nginx terminates TLS and routes traffic to the Clutch services. Enable it when running clutch-deploy:

```bash
docker compose --profile proxy up -d
```

## Routes

A full-stack deployment fronts several backends. Map paths to the right service:

| Path | Backend | Service |
|------|---------|---------|
| `/health` | `clutch-hub-api:3000/health` | Hub API |
| `/graphql` | `clutch-hub-api:3000/graphql` | Hub API |
| `/graphql/ws` | `clutch-hub-api:3000/graphql/ws` | Hub API (WebSocket) |
| `/faucet` | `clutch-hub-api:3000/faucet` | Hub API |
| `/api/` | `clutch-explorer-backend:8088/` | Explorer REST |
| `/` | `clutch-hub-demo-app:80` or `clutch-explorer-frontend:80` | Demo / Explorer UI |
| `/grafana/` | `grafana:3000` | Grafana |
| `/seq/` | `seq:80` | Seq logs |

WebSocket upgrade is required for `/graphql/ws` (see config below).

## Full nginx.conf example

```nginx
upstream hub_api {
    server clutch-hub-api:3000;
}
upstream explorer_api {
    server clutch-explorer-backend:8088;
}
upstream explorer_ui {
    server clutch-explorer-frontend:80;
}
upstream demo_ui {
    server clutch-hub-demo-app:80;
}

server {
    listen 80;
    server_name clutch.example.com;

    # Hub API
    location /health { proxy_pass http://hub_api; }
    location /graphql {
        proxy_pass http://hub_api;
        proxy_set_header Host $host;
    }
    # GraphQL WebSocket subscriptions
    location /graphql/ws {
        proxy_pass http://hub_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
    location /faucet { proxy_pass http://hub_api; }

    # Explorer REST API
    location /api/ {
        proxy_pass http://explorer_api/;
        proxy_set_header Host $host;
    }

    # Explorer UI (or swap to demo_ui for the demo app)
    location / {
        proxy_pass http://explorer_ui;
        proxy_set_header Host $host;
    }

    # Grafana (optional)
    location /grafana/ {
        proxy_pass http://grafana:3000/;
        proxy_set_header Host $host;
    }

    # Seq (optional, restrict in production)
    location /seq/ {
        proxy_pass http://seq:80/;
        proxy_set_header Host $host;
    }
}
```

## SSL / TLS

For production, terminate TLS at Nginx with Let's Encrypt:

1. Install certbot and obtain a certificate:

   ```bash
   certbot certonly --nginx -d clutch.example.com
   ```

2. Update the server block:

   ```nginx
   server {
       listen 443 ssl http2;
       server_name clutch.example.com;

       ssl_certificate     /etc/letsencrypt/live/clutch.example.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/clutch.example.com/privkey.pem;
       ssl_protocols       TLSv1.2 TLSv1.3;
       ssl_ciphers         HIGH:!aNULL:!MD5;

       # ... route blocks from above ...
   }

   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name clutch.example.com;
       return 301 https://$host$request_uri;
   }
   ```

3. Auto-renew: `certbot renew --quiet` via cron/systemd timer.

## Production notes

- Set a real `server_name`; avoid the default `_` for public deployments.
- Add rate limiting on `/faucet` (`limit_req_zone`) to deter testnet abuse.
- Restrict `/seq/` and `/grafana/` to trusted networks or put them behind auth.
- Forward `X-Forwarded-Proto` so the Hub API sees the original scheme.
- Keep `ALLOWED_ORIGINS` in the API config in sync with the domains Nginx serves.

## Config file

`config/nginx/nginx.conf` in the clutch-deploy repo — edit for custom server names or SSL.

## Related

- [Clutch Deploy](/deployment/clutch-deploy)
- [Monitoring](/deployment/monitoring)
- [Environments](/getting-started/environments)
- [Security](/reference/security)
