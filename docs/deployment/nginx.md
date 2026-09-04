---
sidebar_position: 3
---

# Nginx Reverse Proxy

Nginx terminates TLS and routes traffic to the Clutch services. It's optional, and it is **not** a compose profile — no compose file in this stack defines one, so `docker compose --profile proxy up -d` silently starts the stack with no proxy at all, no error. The real nginx overlay is its own compose file that joins the main stack's network from outside it:

```bash
# Main stack first, under project name `clutch-dev` — see below for why that name matters.
docker compose -p clutch-dev -f docker-compose.yml -f docker-compose.dev.yml up -d

# Then the nginx overlay, as its own project:
docker compose -p clutch-nginx -f docker-compose.nginx.yml up -d
```

`docker-compose.nginx.yml` declares its `clutch-network` as `external: true` with the literal name `clutch-dev_clutch-network` — Compose's default `<project>_<network>` naming for a stack started with `-p clutch-dev`. That name is hardcoded, not derived from whatever project name you give the nginx command itself, so the main stack must already be running under **exactly** `-p clutch-dev` before this will start. Bring it up any other way — including the plain `docker compose up -d` from [Clutch Deploy](/deployment/clutch-deploy#quick-start), which takes its project name from the checkout directory instead — and the network won't exist, so `up -d` fails outright rather than starting a proxy with nothing behind it.

## Routes

This is `clutch-deploy`'s actual `config/nginx/nginx.conf` (the local/dev one — see [Local vs stage](#local-vs-stage)). Its routes, in match order:

| Path | Proxies to | Notes |
|------|------------|-------|
| `/api/` | `clutch-hub-api:3000/` | **The Hub API** — not the explorer, despite the name |
| `/graphql` | `clutch-hub-api:3000/graphql` | Prefix match, so this also carries the `/graphql/ws` subscription upgrade; upgrade headers are set unconditionally |
| `/health` | `clutch-hub-api:3000/health` | Hub API |
| `/explorer/api/` | `clutch-explorer-backend:8088/api/v1/` | Explorer REST, path-rewritten |
| `/explorer/` | `clutch-explorer-frontend:80/` | Explorer UI |
| `/payment/` | `payment-orchestrator:8091` | Deposit REST, rewritten (`^/payment(/api/.*)$` → `$1`) — the demo app's `DepositPanel` calls `/payment/api/v1/deposits` by default and **404s without this route** |
| `/` (catch-all) | `clutch-hub-api:3000/` | Everything else |

`/api/` routing to the Hub API rather than the explorer backend is easy to get backwards from the name alone — the explorer's own REST API is `/explorer/api/`. There's no dedicated route for Grafana or Seq: both are published directly on their own host ports (`3030`, `5341`) instead of being proxied here.

## Full nginx.conf

The real file, verbatim, from `clutch-deploy/config/nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream clutch_api {
        server clutch-hub-api:3000;
    }

    upstream clutch_explorer_api {
        server clutch-explorer-backend:8088;
    }

    upstream clutch_explorer_web {
        server clutch-explorer-frontend:80;
    }

    upstream clutch_payment_orchestrator {
        server payment-orchestrator:8091;
    }

    server {
        listen 80;
        server_name localhost;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        location /api/ {
            proxy_pass http://clutch_api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /graphql {
            proxy_pass http://clutch_api/graphql;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            proxy_pass http://clutch_api/health;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /explorer/api/ {
            proxy_pass http://clutch_explorer_api/api/v1/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /explorer/ {
            proxy_pass http://clutch_explorer_web/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # payment-orchestrator is not published on a host port on stage; nginx is the only way
        # in there, so this route (and its stage counterpart) matters even though the
        # orchestrator's own CORS also allows calling it directly on 8091 in local dev.
        location /payment/ {
            rewrite ^/payment(/api/.*)$ $1 break;
            proxy_pass http://clutch_payment_orchestrator;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://clutch_api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
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
- Grafana and Seq bypass this proxy entirely (published directly on `3030`/`5341` — see [Routes](#routes)); restrict them at the host firewall or put your own authenticated proxy in front for any public deployment.
- Forward `X-Forwarded-Proto` so the Hub API sees the original scheme.
- Keep `ALLOWED_ORIGINS` in the API config in sync with the domains Nginx serves.

## Config file

`config/nginx/nginx.conf` in the clutch-deploy repo — edit for custom server names or SSL. This is the **local/dev** config; see below before assuming it applies anywhere else.

## Local vs stage

The config on this page is local/dev only, brought up via the optional overlay described above. It has no bearing on the project's stage deployment: stage's nginx is not part of this compose project at all. It runs as a separate container belonging to another compose project entirely, mounting a hand-maintained config file that lives outside this repo and serves the Clutch routes alongside that other project's own. It holds the host's port 80, so `docker-compose.stage.nginx.yml` cannot run there, and editing anything under `config/nginx/` in this repo has no effect on stage. A change that needs to reach stage's nginx is patched into that mounted file in place by the deploy workflow instead, not shipped by editing this repo's config.

## Related

- [Clutch Deploy](/deployment/clutch-deploy)
- [Monitoring](/deployment/monitoring)
- [Environments](/getting-started/environments)
- [Security](/reference/security)
