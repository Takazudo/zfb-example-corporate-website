---
name: l-handle-zfb-update
description: >-
  Update the zfb upstream dependency (@takazudo/zfb + @takazudo/zfb-runtime) to
  the latest "next" dist-tag release, review the upstream changes between
  versions, and adapt this project's code if needed. Use when: (1) User says
  'update zfb', 'bump zfb', 'zfb update', or 'handle zfb update', (2) A new zfb
  next release is out and this example corporate website should track it.
user-invocable: true
argument-hint: "[target-version, e.g. 0.1.0-next.42 — omit to use latest next]"
---

# Handle zfb Update

Update `@takazudo/zfb` and `@takazudo/zfb-runtime` to the latest `next`
prerelease, check what changed upstream, and adapt this project's code when an
upstream change touches a feature this corporate-website demo actually uses.

Upstream repo: `Takazudo/zudo-front-builder` (monorepo; the npm packages live
under `packages/`). Every release has a `v<version>` tag and a GitHub release
with detailed notes.

## Step 0: Preconditions

`package.json` and `pnpm-lock.yaml` must be clean (`git status --short` shows
neither). If either has uncommitted changes, stop and ask the user before
touching them.

## Step 1: Resolve current and target versions

```bash
CURRENT=$(node -p "require('./package.json').dependencies['@takazudo/zfb']")
TARGET=$(npm view @takazudo/zfb dist-tags.next)
```

- **Always resolve the target from the `next` dist-tag, never `latest`** —
  this project tracks the zfb prerelease line. The two tags may be equal
  today, but when they diverge, `next` is the one to follow.
- If the user passed a version argument, use it as `TARGET` instead. Verify it
  exists for **both** packages: `npm view "@takazudo/zfb@<TARGET>" version`
  and `npm view "@takazudo/zfb-runtime@<TARGET>" version`.
- **If `CURRENT` equals `TARGET`: report "already at the latest next
  (<version>)" and STOP.**
- **If `TARGET` is older than `CURRENT`** (possible with an explicit version
  argument): that is a downgrade — stop and ask the user to confirm before
  proceeding. The enumeration step below detects this case. Additionally,
  **never go below `0.1.0-next.31`**: this repo styles itself entirely via
  `tailwind: { enabled: false }`, and earlier versions dropped all authored
  CSS under that flag (zfb#824) — a downgrade past that floor breaks the
  whole site.

## Step 2: Review upstream changes BEFORE bumping

Enumerate every version between `CURRENT` (exclusive) and `TARGET` (inclusive)
from npm's publish-ordered version list — do NOT sort version strings
lexically; prerelease numbers like `next.9` vs `next.10` sort wrong as text:

```bash
node -e '
const vs = JSON.parse(process.argv[1]);
const cur = vs.indexOf(process.argv[2]), tgt = vs.indexOf(process.argv[3]);
if (tgt < 0) { console.error("target not found"); process.exit(1); }
if (cur >= 0 && tgt <= cur) { console.error("target is not newer than current — downgrade or same"); process.exit(1); }
console.log(vs.slice(cur + 1, tgt + 1).join("\n"));
' "$(npm view @takazudo/zfb versions --json)" "$CURRENT" "$TARGET"
```

Read the release notes for EVERY enumerated version, not just the target's:

```bash
gh release view "v<version>" --repo Takazudo/zudo-front-builder --json body -q '.body'
```

If a release has no notes, fall back to the commit list:

```bash
gh api "repos/Takazudo/zudo-front-builder/compare/v<prev>...v<version>" \
  --jq '.commits[].commit.message' | head -40
```

**Fail closed:** if the upstream changes cannot be reviewed at all (gh
unauthenticated/rate-limited AND no readable release notes), stop and ask the
user — never bump blind.

Flag anything that touches a surface this project uses:

| Upstream surface | Where this project uses it |
| --- | --- |
| `defineConfig` schema (`@takazudo/zfb/config`) | `zfb.config.ts` — `framework: "preact"`, `base`, `tailwind.enabled` |
| Tailwind-disabled CSS path (`tailwind.enabled: false`) | the entire styling approach — regressed pre-next.31 (zfb#824, dropped ALL authored CSS); watch ANY CSS-pipeline change |
| CSS Modules pipeline (`*.module.css` scoping, class-name hashing) | every `components/*/*.module.css`; scoped names appear in rendered HTML + hashed `dist/assets/styles-*.css` |
| Global (non-module) CSS handling | `styles/global.css` (design tokens + reset), imported from `layouts/default.tsx` |
| CSS Modules import typing | `styles/css-modules.d.ts` — ambient `*.module.css` declaration matching how zfb resolves the default import |
| Static rendering / zero-client-JS output | `layouts/default.tsx`, `pages/index.tsx` — no islands, no hydration; the build must keep emitting NO JS |
| `@takazudo/zfb-runtime` peering | not imported anywhere, but it declares an exact peer dependency on `zfb` — both pins must stay on the same version |
| CLI commands (`zfb dev/build/preview/check`) | `package.json` scripts |
| Documented behavior (commands, CSS Modules semantics) | `README.md` — hard-codes the scoped-class example (`QAAyqq_hero`), the command table, and the next.31/zfb#824 floor |

**Rule: adapt only if this project actually uses the changed feature.**
Internal zfb changes (Rust internals, docs, frameworks other than preact,
content collections, pagination, islands runtime, MD/MDX pipeline — none of
which this demo uses) need no action — note them in the report and move on.

## Step 3: Bump both packages

```bash
pnpm add -E "@takazudo/zfb@$TARGET" "@takazudo/zfb-runtime@$TARGET"
```

- `-E` keeps the repo's **exact pin, no caret** convention — this repo
  deliberately pins one known-good zfb version so CI stays reproducible;
  keep it that way.
- Both packages must land on the **same** version — `zfb-runtime`'s peer
  dependency on `zfb` is exact, so a mismatch fails install.
- Commit `package.json` AND `pnpm-lock.yaml` together — CI installs with
  `pnpm install --frozen-lockfile` and fails on a stale lockfile.
- pnpm is the package manager here — npm is only for reading registry
  metadata in Steps 1-2.

## Step 4: Adapt project code (if Step 2 flagged anything)

Apply whatever the flagged release notes require — config schema migrations,
renamed/changed APIs, CSS Modules scoping changes, changed CLI behavior, etc.
If the class-name hashing algorithm changed, update the `QAAyqq_hero` example
in `README.md` to the newly emitted name. If nothing was flagged, skip this
step.

## Step 5: Verify

Clean generated output first so a stale `dist/` cannot mask failures, then
build:

```bash
rm -rf ./dist ./.zfb ./.zfb-build
pnpm build       # expect the single page built cleanly (1 page), no warnings
pnpm typecheck   # zfb check passes
```

Then inspect `dist/` — the checks that matter most here guard the
Tailwind-disabled CSS path (the zfb#824 failure mode):

- `dist/assets/styles-*.css` emitted and linked from `dist/index.html`
- **Authored CSS survived**: the stylesheet contains the global design tokens
  (`--color-ink`) AND scoped module rules (a class matching `*_hero`)
- **No Tailwind leakage**: no preflight/theme layers in the stylesheet
  (`grep -c 'tw-\|--tw\|@layer' dist/assets/styles-*.css` → 0)
- **Still zero JS**: no `.js` files anywhere in `dist/`, no `<script>` tags in
  `dist/index.html` — this demo is fully static
- No stranded `zfb-tailwind-entry-*.css` temp files

Optional but recommended — dev-server smoke test. Note `pnpm dev` wipes
`dist/` via the `predev` script, so do this AFTER the dist inspection and
re-run `pnpm build` if you need the artifacts again:

```bash
pnpm dev   # then check / returns 200 with the scoped class names in the HTML
```

If verification fails, map the failure back to the release notes from Step 2 —
it usually points at an upstream change that needs a project-side adaptation
(return to Step 4).

## Step 6: Report

Summarize for the user:

- Versions traversed (e.g. `next.31 → next.35`)
- Notable upstream changes per release (one line each)
- Adaptations made to project code (or "none needed")
- Verification results (build, typecheck, dist inspection — CSS survival, no
  Tailwind leakage, zero JS — and smoke test if run)
