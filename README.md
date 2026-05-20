# zfb-example-corporate-website

A polished corporate marketing website built with [zfb](https://github.com/Takazudo/zudo-front-builder)
and styled entirely with **CSS Modules** — no Tailwind.

**Live demo:** https://zfb-example-corporate-website.pages.dev/

It is one of three standalone zfb demo repos produced by the zfb
"Demo Separation" epic. This one showcases the CSS-Modules styling path:
every component owns a scoped `*.module.css` file, with a single global
stylesheet for design tokens and a light reset.

## What it demonstrates

- A statically rendered Preact site: hero, services, about, and contact
  sections plus header/footer chrome.
- Component-scoped styling via `*.module.css` — class names are rewritten to
  scoped, file-stable identifiers at build time, so two components can both
  declare a `.card` class without colliding.
- `zfb.config.ts` with `base: "/"` and Tailwind disabled.

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
`KdPA9G_hero`) that appears in both the rendered HTML and the hashed
`dist/assets/styles-<hash>.css`.

## Repository layout

```
pages/        route components (index.tsx)
layouts/      shared page chrome (default.tsx)
components/   per-section components, each with its own *.module.css
styles/       global.css (design tokens + reset), css-modules.d.ts
zfb.config.ts framework config (Preact, Tailwind disabled)
```

## Sibling layout

This repo depends on the `zfb` framework via relative `file:` dependencies
(`@takazudo/zfb` and `@takazudo/zfb-runtime`). It expects the `zfb` repo
checked out as a **sibling directory**:

```
~/repos/zfb-ex/
  zfb/                            <- the zfb framework repo (pinned SHA)
  zfb-example-corporate-website/  <- this repo
```

The exact `zfb` commit this demo builds against is pinned in
[`framework-pins.json`](./framework-pins.json).

## Local development

On a fresh checkout, bootstrap the sibling and build:

```sh
pnpm setup:upstream   # clones zfb at the pinned SHA, builds the zfb CLI, then pnpm build
```

`scripts/setup-upstream.mjs` clones the `zfb` sibling at the pinned SHA,
installs its workspace deps, builds the `zfb` CLI into a project-local
`.zfb-bin/`, then runs `pnpm install` + `pnpm build` here.

Once the sibling exists and the `zfb` CLI is on `PATH`:

```sh
pnpm install
pnpm build      # zfb build  -> dist/
pnpm preview    # zfb preview -> serves dist/
pnpm typecheck  # zfb check
```

> **Validate with `zfb build` / `zfb preview`, not `zfb dev`.** For CSS
> Modules, `zfb build` output is fully correct (scoped class names in HTML
> *and* matching scoped rules in the hashed CSS). The `zfb dev` CSS-serving
> path may not yet emit the matching scoped rules.

## Deployment

`.github/workflows/deploy.yml` deploys `dist/` to the Cloudflare Pages
project `zfb-example-corporate-website` on every push to `main`. CI clones
the `zfb` sibling **inline** at the pinned SHA, builds the `zfb` CLI from
cargo, runs `pnpm build`, and deploys with `wrangler`. It needs the repo
secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.

## Post-merge pin-bump procedure

`framework-pins.json` currently pins `zfb.sha` to the **HEAD of the
`base/demo-separation` branch** in the `zfb` repo:

```
1a01628843286354c676813d8b63a52feb01cff8
```

After the Demo Separation epic PR (#319) merges `base/demo-separation` into
`main` in the `zfb` repo, that branch becomes a dead branch and may be
deleted, while `main` is the durable ref. At that point this repo must bump
its pin:

1. Find the **merge commit SHA** on `zfb`'s `main` (the commit that merged
   `base/demo-separation`).
2. Replace `zfb.sha` in `framework-pins.json` with that `main` merge SHA.
3. Commit the bump and push to `main` — CI re-clones `zfb` at the new SHA
   and re-deploys.

This keeps CI reproducible against a permanent ref. (Epic step S8 verifies
and finalizes this bump.)
