# clutch-docs — Docusaurus Documentation Site

Developer docs for Clutch Protocol, deployed to https://docs.clutchprotocol.io.
Docusaurus 3 (classic preset) + TypeScript config. Node >= 20 (see `engines` in `package.json`).
Workspace-level context lives in `../CLAUDE.md` — this file covers only this repo.

## Commands

```bash
npm install
npm start          # dev server at http://localhost:3000, hot reload
npm run build      # production build → build/ (fails on broken links)
npm run serve      # serve the production build locally
npm run typecheck  # tsc over config/src
```

`onBrokenLinks: 'throw'` — a bad internal link breaks `npm run build`. Always build before pushing content changes.

## Content Map (`docs/`)

| Section | Path | Covers |
|---------|------|--------|
| Introduction | `docs/intro.md` | Landing doc, key features, CLT payments |
| Getting Started | `docs/getting-started/` | quickstart, docker-deploy, architecture, ride-lifecycle, app-developer-incentives, environments |
| Clutch Node | `docs/clutch-node/` | overview, configuration, running, transaction-types, clt-economics, json-rpc (WebSocket JSON-RPC reference) |
| Clutch Hub API | `docs/clutch-hub-api/` | overview, authentication (JWT), graphql (schema reference), errors, subscriptions, configuration |
| Clutch Hub SDK | `docs/clutch-hub-sdk-js/` | overview, installation, usage, api-reference, subscriptions |
| Demo App | `docs/demo-app/` | overview, getting-started, user-flows (passenger/driver) |
| Clutch Explorer | `docs/clutch-explorer/` | overview, getting-started, api-reference (REST) |
| Deployment | `docs/deployment/` | clutch-deploy (compose), monitoring (Grafana/Prometheus/Seq), nginx |
| Reference | `docs/reference/` | security, transaction-flow, signing-and-encoding (RLP/secp256k1), docker-images, faq |

No versioning, no blog (`blog: false`), no i18n beyond `en`. All content is `.md` (no `.mdx` files yet, though MDX is supported).

## Sidebars

`sidebars.ts` is **fully explicit** — one sidebar (`docsSidebar`) listing every doc ID by hand. Adding a page requires two steps:

1. Create `docs/<section>/<kebab-case-name>.md`
2. Add its ID (path without extension, e.g. `clutch-node/json-rpc`) to the matching category in `sidebars.ts`

Docs also carry `sidebar_position` front-matter, but with an explicit sidebar the array order in `sidebars.ts` is what actually controls ordering — keep both consistent anyway (every existing doc has it).

## Site Config (`docusaurus.config.ts`)

- `url: https://docs.clutchprotocol.io`, `baseUrl: /`, `trailingSlash: false`, `future.v4: true`
- **Docs served at site root**: `routeBasePath: '/'` — doc URLs have no `/docs/` prefix (e.g. `/clutch-node/overview`). Internal links use absolute paths like `/clutch-hub-api/overview`.
- **Mermaid** enabled via `markdown.mermaid: true` + `@docusaurus/theme-mermaid` — used freely in architecture/lifecycle/economics docs.
- `editUrl` points to `github.com/clutchprotocol/clutch-docs/tree/main/`.
- Navbar links out to stage demo, npm SDK, marketing site, clutch-deploy repo, GitHub org. Footer link groups: Docs / Build / Project / Community.
- Custom domain: `static/CNAME` (`docs.clutchprotocol.io`) + `static/.nojekyll` — do not delete these.

## Customizations (`src/`)

- `src/pages/index.tsx` — custom landing page (hero, feature-card grid linking into sections, architecture steps). Update the `features` array / links when sections change.
- `src/css/custom.css` — brand palette only (`--ifm-color-primary` family, indigo `#667eea` from the logo gradient) with dark-mode variants. No swizzled theme components.
- `static/img/` — logo, favicon, social card, and **placeholder SVG screenshots** (`demo-*.svg`, `explorer-*.svg`, `grafana.svg`) referenced as `/img/...`; docs contain notes on replacing them with real PNG captures.

## Deploy

`.github/workflows/deploy.yml` — on push to `main`: Node 20, `npm ci && npm run build`, upload `build/` as Pages artifact, then `actions/deploy-pages` to GitHub Pages. No manual deploy step; `npm run deploy` (docusaurus deploy) is unused.

## Conventions

- Front-matter: just `sidebar_position: N`; the H1 (`# Title`) provides the title, path provides the ID/slug.
- File names: kebab-case, `.md`.
- Images go in `static/img/`, referenced by absolute path `/img/name.ext`.
- Cross-doc links: absolute root-relative paths (`/getting-started/quickstart`), never relative file links.

## When to Update These Docs (cross-repo)

- `clutch-node` RPC or transaction changes → `docs/clutch-node/json-rpc.md`, `transaction-types.md`, `docs/reference/signing-and-encoding.md`
- `clutch-hub-api` GraphQL schema/auth changes → `docs/clutch-hub-api/*`
- `clutch-hub-sdk-js` API changes → `docs/clutch-hub-sdk-js/*` (npm SDK link in navbar)
- `clutch-explorer` REST changes → `docs/clutch-explorer/api-reference.md`
- `clutch-deploy` compose/port changes → `docs/deployment/*`, `docs/getting-started/docker-deploy.md`
