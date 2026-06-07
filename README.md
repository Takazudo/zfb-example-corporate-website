# zfb-example-corporate-website

A polished corporate marketing website built with [zfb](https://github.com/Takazudo/zudo-front-builder)
and authored entirely with **CSS Modules** — no Tailwind utilities anywhere
in the source.

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
- `zfb.config.ts` with `tailwind: { enabled: false }` — the compiled
  stylesheet contains only this demo's authored CSS (global tokens +
  scoped module rules), no Tailwind preflight/theme layers. This requires
  zfb >= `0.1.0-next.31`; earlier versions dropped all authored CSS when
  the flag was set
  ([zfb#824](https://github.com/Takazudo/zudo-front-builder/issues/824)).

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

## Repository layout

```
pages/        route components (index.tsx)
layouts/      shared page chrome (default.tsx)
components/   per-section components, each with its own *.module.css
styles/       global.css (design tokens + reset), css-modules.d.ts
zfb.config.ts framework config (Preact, Tailwind disabled)
```

## Framework dependency

This repo depends on the `zfb` framework via the published npm packages
[`@takazudo/zfb`](https://www.npmjs.com/package/@takazudo/zfb) and
[`@takazudo/zfb-runtime`](https://www.npmjs.com/package/@takazudo/zfb-runtime),
pinned to an exact prerelease version in `package.json`. `@takazudo/zfb`
ships a prebuilt Rust binary per platform via npm optional dependencies —
no cargo toolchain or sibling checkout required.

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

`.github/workflows/deploy.yml` deploys `dist/` to the Cloudflare Pages
project `zfb-example-corporate-website` on every push to `main`. CI installs
zfb from npm (`pnpm install`), runs `pnpm build`, and deploys with
`wrangler`. It needs the repo secrets `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN`.

Pull requests get a per-branch preview deploy at
`https://<branch-slug>.zfb-example-corporate-website.pages.dev/` (slashes
in the branch name become hyphens), with the URL posted as a PR comment.

## Updating zfb

`package.json` pins `@takazudo/zfb` and `@takazudo/zfb-runtime` to an
exact version (the two must match — `zfb-runtime` declares an exact peer
dependency on `zfb`). This project tracks the **`next` dist-tag** (the zfb
prerelease line), never `latest`. To move this demo to a newer zfb:

1. Pick the new version from the `next` dist-tag:
   `npm view @takazudo/zfb dist-tags.next`.
2. Update both versions in `package.json`, run `pnpm install`, and verify
   with `pnpm build`.
3. Commit (including `pnpm-lock.yaml`) and push — CI rebuilds and
   re-deploys.

Pinning exact versions keeps CI reproducible.

The `/l-handle-zfb-update` Claude Code skill
(`.claude/skills/l-handle-zfb-update/SKILL.md`) automates this process,
including a review of every intermediate upstream release note before
the bump.
