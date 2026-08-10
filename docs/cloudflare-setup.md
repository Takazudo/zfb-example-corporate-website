# Cloudflare setup — from zero to deployed

An ordered walkthrough for wiring this repo up to Cloudflare Workers static
assets, start to finish.

> **Migrated from Cloudflare Pages.** This repo previously deployed to the Pages
> project `zfb-example-corporate-website` at `*.pages.dev`. It now deploys as a
> **Worker** serving static assets, on the custom domain
> https://zfb-example-corporate-website.takazudomodular.com/. The old Pages
> project is no longer written to and can be deleted from the dashboard.

The deployment itself is described in the README's
[Deployment](../README.md#deployment) section; this document is the
step-by-step setup path behind it.

## What gets deployed

`.github/workflows/deploy.yml` runs on every push to `main` and on every pull
request targeting `main`. It installs dependencies with
`pnpm install --frozen-lockfile`, runs `pnpm build`, and deploys the resulting
`dist/` directory with `wrangler deploy`.

There is nothing to provision by hand. `wrangler deploy` is create-and-update in
one: the first successful run creates the Worker named in `wrangler.toml`, and
later runs update it. **Do not create the Worker from the Cloudflare dashboard
wizard** — that produces either an orphan Worker unrelated to this repo, or a
competing Cloudflare git-build pipeline that fights this workflow.

This site is pure SSG, so `wrangler.toml` declares an **assets-only** Worker: an
`[assets]` table with no `main` key. No D1, KV, or Worker secrets are involved.

## 1. Create (or reuse) the Cloudflare API token

All `zfb-example-*` repos deploy to the **same Cloudflare account** and share
**one token**. If you already minted it for another repo in the family, reuse it
here — but confirm it carries the Zone permission below, which the Pages-era
token did not need. The family-wide guide, including the union of permissions
every repo needs, is at
[cloudflare-shared-token-and-env-setup.md](https://github.com/Takazudo/zfbex-tweaker/blob/main/docs/cloudflare-shared-token-and-env-setup.md).

To mint a token that covers **this repo only**: Cloudflare dashboard → **My
Profile → API Tokens → Create Token → Create Custom Token**, with these
permissions:

| Type | Permission | Access |
| --- | --- | --- |
| Account | **Workers Scripts** | Edit |
| Account | **Account Settings** | Read |
| Zone | **Workers Routes** | Edit |

- **Account Resources**: Include → *your account*.
- **Zone Resources**: Include → `takazudomodular.com`.
- **Client IP / TTL**: leave at the defaults.

:warning: **The Zone permission is the one that is easy to miss.** The dashboard's
"Edit Cloudflare Workers" token template does *not* include Zone · Workers
Routes. Without it, `wrangler deploy` uploads the script successfully and then
fails attaching the `[[routes]]` custom domain — the site is reachable on
`*.workers.dev` but `zfb-example-corporate-website.takazudomodular.com` never
starts resolving.

Cloudflare shows the token value only once — copy it before leaving the page.
You also need your **Account ID** (dashboard → any domain → right sidebar, or
`wrangler whoami`).

## 2. Set the two GitHub Actions secrets

The workflow reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the
repo's Actions secrets. Set them via **Settings → Secrets and variables →
Actions**, or with `gh`:

```sh
gh secret set CLOUDFLARE_API_TOKEN \
  --repo Takazudo/zfb-example-corporate-website
gh secret set CLOUDFLARE_ACCOUNT_ID \
  --repo Takazudo/zfb-example-corporate-website
```

Without `--body`, `gh` prompts for the value and keeps it out of your shell
history. Confirm both landed:

```sh
gh secret list --repo Takazudo/zfb-example-corporate-website
```

## 3. Trigger a deploy

Any push to `main` deploys. To deploy without a new commit, re-run the most
recent workflow run:

```sh
gh run list --repo Takazudo/zfb-example-corporate-website \
  --workflow "Deploy" --limit 1
gh run rerun <run-id> --repo Takazudo/zfb-example-corporate-website
```

Watch it to completion:

```sh
gh run watch <run-id> --repo Takazudo/zfb-example-corporate-website
```

To validate the config without deploying — and without any credentials at all:

```sh
pnpm exec wrangler deploy --dry-run
```

## 4. Verify

- **Automatic**: the deploy job runs `pnpm smoke` immediately after
  `wrangler deploy`. It checks the live custom domain for HTTP 200 over valid
  TLS, this site's content marker, the hashed stylesheet, and a 404 on an
  unknown path. While the hostname does not resolve yet it self-skips with exit
  0 and a notice rather than failing. Run it locally the same way:

  ```sh
  pnpm smoke
  ```

- **Production**: https://zfb-example-corporate-website.takazudomodular.com/
  should serve the freshly built page.

  ```sh
  curl -sI https://zfb-example-corporate-website.takazudomodular.com/ | head -1
  ```

- **Pull request previews**: every PR against `main` uploads a non-production
  version aliased `pr-<N>`, live at
  `https://pr-<N>-zfb-example-corporate-website.<subdomain>.workers.dev/`, with
  the URL posted (and updated) as a PR comment. Production keeps serving `main`
  the whole time.
- **Cloudflare dashboard**: Workers & Pages → `zfb-example-corporate-website`
  lists every version and deployment.

## Troubleshooting

**The deploy fails on the route / custom domain step.** The token is missing
**Zone · Workers Routes · Edit**, or its Zone Resources do not include
`takazudomodular.com`. The script upload before it usually succeeded, so the
Worker exists and `*.workers.dev` works while the custom domain does not. Add
the permission and re-run — no code change is needed.

**`Authentication error [code: 10000]` on the deploy step.** The token is
missing, expired, or lacks **Workers Scripts · Edit**. Re-check the secret value
and the token's permissions, then re-run. A token edited in the Cloudflare
dashboard keeps the same value, so the GitHub secret only needs updating if you
minted a new token.

**`Unable to retrieve account`.** Usually a wrong `CLOUDFLARE_ACCOUNT_ID`, or a
token whose **Account Resources** do not include that account. Verify with
`wrangler whoami` locally using the same token.

**The preview URL prints but returns `error code: 1042`.** The workers.dev
hostname is private. `wrangler.toml` must have **both** `workers_dev = true` and
`preview_urls = true`; `preview_urls` defaults to *match* `workers_dev`, so it is
set explicitly to keep previews alive if `workers_dev` is ever turned off.

**wrangler warns "Unexpected fields found in assets field".** A top-level key
(`workers_dev`, `preview_urls`, `routes`) has drifted *below* the `[assets]`
table. In TOML every key after a table header belongs to that table, so wrangler
silently ignores it. Move it back above `[assets]`.

**The deploy step is skipped with a notice.** `CLOUDFLARE_API_TOKEN` is unset.
This is expected on pull requests from forks — GitHub does not expose repo
secrets to them — and on a fresh clone that has not been wired up yet.

**The smoke test is skipped with a notice.** The custom domain does not resolve
yet. Either the deploy has not attached it (see the first entry above) or DNS is
still propagating; re-run after a minute.

**`pnpm install --frozen-lockfile` fails.** `package.json` and `pnpm-lock.yaml`
are out of sync. Run `pnpm install` locally and commit the updated lockfile.
