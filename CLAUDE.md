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

No versioning, no i18n beyond `en`. Blog enabled at `/blog` (see below). All content is `.md` (no `.mdx` files yet, though MDX is supported).

## Sidebars

`sidebars.ts` is **fully explicit** — one sidebar (`docsSidebar`) listing every doc ID by hand. Adding a page requires two steps:

1. Create `docs/<section>/<kebab-case-name>.md`
2. Add its ID (path without extension, e.g. `clutch-node/json-rpc`) to the matching category in `sidebars.ts`

Docs also carry `sidebar_position` front-matter, but with an explicit sidebar the array order in `sidebars.ts` is what actually controls ordering — keep both consistent anyway (every existing doc has it).

## Blog (`blog/`)

Enabled through the classic preset's `blog` options in `docusaurus.config.ts`; served at `/blog`, with feeds at `/blog/rss.xml` and `/blog/atom.xml`.

- Posts: `blog/YYYY-MM-DD-kebab-slug.md` with front-matter `title`, `authors: [key]`, optional `tags`. The body must contain `<!-- truncate -->` after the summary paragraph — the build throws without it (`onUntruncatedBlogPosts: 'throw'`).
- Authors come only from `blog/authors.yml` (`onInlineAuthors: 'throw'`). Add the key there before using it.
- Tags come from `blog/tags.yml`; add a key there before tagging a post with it.
- The navbar and footer carry a `to: '/blog'` item. With zero posts the plugin creates no routes, so that link would trip `onBrokenLinks: 'throw'`: never delete the last post without removing both items.
- Posts are MDX: a bare `<` or `{` in prose breaks the build. Keep them inside code spans.

## Site Config (`docusaurus.config.ts`)

- `url: https://docs.clutchprotocol.io`, `baseUrl: /`, `trailingSlash: false`, `future.v4: true`
- **Docs served at site root**: `routeBasePath: '/'` — doc URLs have no `/docs/` prefix (e.g. `/clutch-node/overview`). Internal links use absolute paths like `/clutch-hub-api/overview`.
- **Mermaid** enabled via `markdown.mermaid: true` + `@docusaurus/theme-mermaid` — used freely in architecture/lifecycle/economics docs.
- `editUrl` points to `github.com/clutchprotocol/clutch-docs/tree/main/`.
- Navbar links out to the mainnet app, the testnet demo, npm SDK, marketing site, clutch-deploy repo, GitHub org. Footer link groups: Docs / Build / Project / Community.
- The yellow announcement bar has an `id` (`mainnet-pilot`). A visitor who closes it is remembered by that id, so change the id when the text changes in a way everyone should see again.
- **Status words must stay true.** Since 2026-10-05 the mainnet is a live capped pilot (real USDT, small limits, withdrawals not open until the payout wallet is activated) and the stage is a testnet. The pages that carry status are `intro.md`, `reference/faq.md`, `reference/mainnet-readiness.md`, `reference/security.md`, `getting-started/environments.md`, `clutch-treasury/{overview,deposits,redemptions}.md` and the docs homepage; the pilot's limits are in `environments.md` and `deposits.md`. Change them together when the pilot changes (for example when withdrawals open).
- Custom domain: `static/CNAME` (`docs.clutchprotocol.io`) + `static/.nojekyll` — do not delete these.

## Customizations (`src/`)

- `src/pages/index.tsx` — custom landing page (hero, a three-line "What is Clutch?" summary, feature-card grid linking into sections, architecture steps). Update the `features` array / links when sections change. The three summary lines are the same as in the org profile README (`.github/profile/README.md`) and on clutchprotocol.io, so change all three places together.
- `src/css/custom.css` — brand palette only (`--ifm-color-primary` family, indigo `#667eea` from the logo gradient) with dark-mode variants. No swizzled theme components.
- `static/img/` — logo, favicon, social card, and **placeholder SVG screenshots** (`demo-*.svg`, `explorer-*.svg`, `grafana.svg`) referenced as `/img/...`; docs contain notes on replacing them with real PNG captures.

## Deploy

`.github/workflows/build-check.yml` runs the same install, typecheck and build on every pull request, because `deploy.yml` only runs after a merge and a broken link or anchor stops it. `.github/workflows/deploy.yml` — on push to `main`: Node 20, `npm ci && npm run build`, upload `build/` as Pages artifact, then `actions/deploy-pages` to GitHub Pages. No manual deploy step.

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
