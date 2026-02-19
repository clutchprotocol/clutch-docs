# Clutch Protocol Docs

Documentation site for [Clutch Protocol](https://clutchprotocol.io), built with [Docusaurus](https://docusaurus.io).

## Local Development

```bash
npm install
npm start
```

Open http://localhost:3000

## Build

```bash
npm run build
npm run serve
```

## Deploy

Pushes to `main` trigger automatic deployment to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

**URL:** https://docs.clutchprotocol.io (after configuring custom domain)

## Custom Domain Setup

1. In GitHub repo: **Settings** → **Pages** → set custom domain to `docs.clutchprotocol.io`
2. Add DNS CNAME: `docs.clutchprotocol.io` → `clutchprotocol.github.io`
3. The `static/CNAME` file is included in the build.
