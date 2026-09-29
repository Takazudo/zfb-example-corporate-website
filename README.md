# zfb-example-corporate-website

A polished corporate marketing website built with [zfb](https://github.com/Takazudo/zudo-front-builder)
and authored entirely with **CSS Modules** — no Tailwind utilities anywhere
in the source.

**Live demo:** https://zfb-example-corporate-website.takazudomodular.com/

It is one of three standalone zfb demo repos produced by the zfb
"Demo Separation" epic. This one showcases the CSS-Modules styling path:
every component owns a scoped `*.module.css` file, with a single global
stylesheet for design tokens and a light reset.

## What it demonstrates

- A statically rendered site using zfb's own **zudo-react** JSX runtime
  (zfb 3): hero, services, about, and contact sections plus header/footer
  chrome. There are no islands, so no client JavaScript ships.
- Component-scoped styling via `*.module.css` — class names are rewritten to
  scoped, file-stable identifiers at build time, so two components can both
  declare a `.card` class without colliding.
- `zfb.config.ts` with `wind: false` — the built-in zudo-wind utility engine
  is off, so the compiled stylesheet contains only this demo's authored CSS
  (global tokens + reset + scoped module rules), no generated utilities and
  no extra reset layer.

## CSS Modules usage

Any file named `*.module.css` is a CSS Module; a plain `.css` file stays
global. Import the styles as a default import and reference classes with
static member access:

```tsx
import styles from "./hero.module.css";

export default function Hero() {
  return <section class={styles.hero}>…</section>;
}
```

`styles.hero` resolves at build time to the scoped class name (e.g.
`QAAyqq_hero`) that appears in both the rendered HTML and the hashed
`dist/assets/styles-<hash>.css`. The scope hash is derived from the
project-relative module path, so byte-identical sources build to identical
class names on any machine.

JSX uses HTML attribute spellings (`class`, `for`, `charset`,
`autocomplete`), because zudo-react renders intrinsic elements with their HTML
names; React spellings such as `className` or `charSet` fail `zfb check`.

## Repository layout

```
pages/        route components (index.tsx)
layouts/      shared page chrome (default.tsx)
components/   per-section components, each with its own *.module.css
styles/       global.css (design tokens + reset), css-modules.d.ts
zfb.config.ts zfb config (wind: false — authored CSS only)
```

## Framework dependency

This repo depends on the `zfb` framework via the published npm packages
[`@takazudo/zfb`](https://www.npmjs.com/package/@takazudo/zfb) and
[`@takazudo/zfb-runtime`](https://www.npmjs.com/package/@takazudo/zfb-runtime),
pinned to an exact version in `package.json`. `@takazudo/zfb`
ships a prebuilt Rust binary per platform via npm optional dependencies —
no cargo toolchain or sibling checkout required. The JSX runtime is part of
`@takazudo/zfb` itself (`jsxImportSource: "@takazudo/zfb/zudo-react"` in
`tsconfig.json`); there is no Preact or React dependency.

## Local development

```sh
pnpm install
pnpm build      # zfb build  -> dist/
pnpm preview    # zfb preview -> serves dist/
pnpm typecheck  # zfb check
```

Both `zfb dev` and `zfb build` emit the scoped CSS Modules class names in
HTML together with the matching scoped rules in the served/hashed CSS.

## Deployment

`.github/workflows/deploy.yml` deploys `dist/` to **Cloudflare Workers static
assets** — the Worker `zfb-example-corporate-website`, served at
https://zfb-example-corporate-website.takazudomodular.com/. CI installs zfb
from npm (`pnpm install`), runs `pnpm build`, and deploys with `wrangler`. It
needs the repo secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.

Because this site is pure SSG — no `@takazudo/zfb-adapter-cloudflare`, no
server bundle — `wrangler.toml` declares an **assets-only** Worker: it has an
`[assets]` table but deliberately no `main`. Cloudflare serves `dist/` straight
from the edge and no Worker code runs. The custom domain is attached by the
`[[routes]]` entry with `custom_domain = true`, which makes Cloudflare manage
the DNS record and TLS certificate for that hostname.

The workflow has three jobs:

- **build** — typecheck and build. Runs on every push and PR, needs no
  credentials, so a fresh clone or fork is green immediately.
- **deploy** — push to `main` only: `wrangler deploy`, then `pnpm smoke`.
- **preview** — pull requests only: `wrangler versions upload --preview-alias
  pr-<N>` publishes the PR's build as a non-production version at
  `https://pr-<N>-zfb-example-corporate-website.<subdomain>.workers.dev/`,
  posted as a PR comment. Production keeps serving `main` throughout.

Both Cloudflare-touching jobs self-skip when `CLOUDFLARE_API_TOKEN` is unset,
so fork PRs and un-provisioned clones report a notice instead of a red job.

For an ordered "from zero to deployed" walkthrough — minting the API token,
setting the secrets, triggering and verifying — see
[`docs/cloudflare-setup.md`](docs/cloudflare-setup.md).

### Post-deploy smoke test

`pnpm smoke` (`scripts/smoke.mjs`, plain Node — no test framework) runs after
every production deploy and checks the live custom domain: HTTP 200 over valid
TLS, HTML carrying this site's content marker, the hashed stylesheet resolving,
and an unknown path returning 404. Only a request to the real hostname can
prove the custom domain is actually attached; no build-time or unit test can
see that.

While the hostname does not resolve yet, the script **self-skips** with exit 0
and a GitHub Actions notice, so the deploy is not red before Cloudflare is
wired up. A hostname that does resolve but serves the wrong thing is a real
failure. Point it elsewhere with `SMOKE_URL=... pnpm smoke`.

### Cloudflare API token permissions

The `CLOUDFLARE_API_TOKEN` repo secret is a custom token (Cloudflare dashboard
→ My Profile → API Tokens → Create Custom Token) with these permissions:

| Type | Permission | Access |
| --- | --- | --- |
| Account | **Workers Scripts** | Edit |
| Account | **Account Settings** | Read |
| Zone | **Workers Routes** | Edit |

Set **Account Resources → Include → (your account)** and **Zone Resources →
Include → `takazudomodular.com`**.

The Zone permission is what attaches the custom domain. Without it the script
upload succeeds and the deploy then fails on the route step — the site stays
reachable on `*.workers.dev` but the custom domain is never created. A single
token can be shared across all `zfb-example-*` repos if it carries the union of
every repo's permissions.

## Updating zfb

`package.json` pins `@takazudo/zfb` and `@takazudo/zfb-runtime` to an
exact version (the two must match — `zfb-runtime` declares an exact peer
dependency on `zfb`). This project tracks the stable **`latest` dist-tag**.
To move this demo to a newer zfb:

1. Pick the new version from the `latest` dist-tag:
   `npm view @takazudo/zfb dist-tags.latest`.
2. Update both versions in `package.json`, run `pnpm install`, and verify
   with `pnpm typecheck` and `pnpm build`.
3. Commit (including `pnpm-lock.yaml`) and push — CI rebuilds and
   re-deploys.

A **major** bump is a migration, not a version edit: read the upstream
migration guide for that major first. The 2.x → 3 move, for example, removed
the `framework` and `tailwind` config keys, replaced Preact with zudo-react,
and required HTML attribute spellings. Before merging it, compare the built
page in a browser against the previous version.

Pinning exact versions keeps CI reproducible.

Do **not** resolve from the `next` dist-tag. The zfb prerelease line ended at
`1.1.0-next.1`, which is older than the current stable line, so `next` now
points at a dead, superseded version — using it as an update target would
downgrade this project.

The `/l-handle-zfb-update` Claude Code skill
(`.claude/skills/l-handle-zfb-update/SKILL.md`) automates this process,
including a review of every intermediate upstream release note before
the bump.
