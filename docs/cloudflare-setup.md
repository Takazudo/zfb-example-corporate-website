# Cloudflare setup — from zero to deployed

An ordered walkthrough for wiring this repo up to Cloudflare Pages, start to
finish.

> **This repo is already deployed.** It is live at
> https://zfb-example-corporate-website.pages.dev/ and its two GitHub Actions
> secrets are already set, so steps 1 and 2 are done. Follow them only when you
> are rotating the API token, moving to a different Cloudflare account, or
> recreating the repo from scratch. Steps 3 and 4 are always safe to run.

The deployment itself is described in the README's
[Deployment](../README.md#deployment) section; this document is the
step-by-step setup path behind it.

## What gets deployed

`.github/workflows/deploy.yml` runs on every push to `main` and on every pull
request targeting `main`. It installs dependencies with
`pnpm install --frozen-lockfile`, runs `pnpm build`, and deploys the resulting
`dist/` directory to the Cloudflare Pages project
**`zfb-example-corporate-website`** with `wrangler`.

There is nothing to provision by hand: the workflow's "Ensure Cloudflare Pages
project exists" step runs `wrangler pages project create` idempotently, so the
Pages project is created on the first successful run and the step is a no-op
afterwards. No D1, KV, or Worker secrets are involved.

## 1. Create (or reuse) the Cloudflare API token

All nine `zfb-example-*` repos deploy to the **same Cloudflare account** and
share **one account-scoped token**. If you already minted it for another repo
in the family, reuse it here — there is nothing repo-specific about it. The
family-wide guide, including the union of permissions every repo needs, is at
[cloudflare-shared-token-and-env-setup.md](https://github.com/Takazudo/zfbex-tweaker/blob/main/docs/cloudflare-shared-token-and-env-setup.md).

To mint a token that covers **this repo only**: Cloudflare dashboard → **My
Profile → API Tokens → Create Token → Create Custom Token**, with these
permissions:

| Type | Permission | Access |
| --- | --- | --- |
| Account | **Cloudflare Pages** | Edit |
| Account | **Account Settings** | Read |

- **Account Resources**: Include → *your account*.
- **Zone Resources**: none. This repo deploys to a `*.pages.dev` host, not a
  custom domain, so no Zone permission is required.
- **Client IP / TTL**: leave at the defaults.

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
  --workflow "Deploy to Cloudflare Pages" --limit 1
gh run rerun <run-id> --repo Takazudo/zfb-example-corporate-website
```

Watch it to completion:

```sh
gh run watch <run-id> --repo Takazudo/zfb-example-corporate-website
```

## 4. Verify

- **Production**: https://zfb-example-corporate-website.pages.dev/ should
  serve the freshly built page. A quick check from the shell:

  ```sh
  curl -sI https://zfb-example-corporate-website.pages.dev/ | head -1
  ```

- **Pull request previews**: every PR against `main` gets its own deploy at
  `https://<branch-slug>.zfb-example-corporate-website.pages.dev/`, where the
  slug is the branch name with slashes replaced by hyphens. The workflow posts
  (and updates) a PR comment carrying the URL.
- **Cloudflare dashboard**: Workers & Pages → `zfb-example-corporate-website`
  lists every deployment with its commit hash.

## Troubleshooting

**`Authentication error [code: 10000]` on the deploy step.** The token is
missing, expired, or lacks **Cloudflare Pages · Edit**. Re-check the secret
value and the token's permissions, then re-run the workflow — a token edited
in the Cloudflare dashboard keeps the same value, so the GitHub secret only
needs updating if you minted a new token.

**`Unable to retrieve account` or the project is not found.** Usually a wrong
`CLOUDFLARE_ACCOUNT_ID`, or a token whose **Account Resources** do not include
that account. Verify with `wrangler whoami` locally using the same token.

**"Project create failed with unexpected error".** The idempotent create step
only tolerates errors that look like "already exists" (Cloudflare code
`8000077`). Anything else — most often a permission problem — fails the job
deliberately rather than deploying into an unknown state. Read the printed
wrangler output; it names the cause.

**The deploy step fails on a pull request from a fork.** GitHub does not expose
repo secrets to fork-based pull requests, so `CLOUDFLARE_API_TOKEN` is empty
and the deploy cannot authenticate. This is expected; preview deploys only work
for branches pushed to this repo.

**`pnpm install --frozen-lockfile` fails.** `package.json` and
`pnpm-lock.yaml` are out of sync. Run `pnpm install` locally and commit the
updated lockfile.

**The deploy retried three times and gave up.** The workflow retries
`wrangler pages deploy` up to three times with 150-second backoffs, so a red
job after all three usually means a persistent problem (auth, permissions, a
Cloudflare incident) rather than a transient blip. Check
[Cloudflare status](https://www.cloudflarestatus.com/) before digging further.
