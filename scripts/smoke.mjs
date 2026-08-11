#!/usr/bin/env node
// Post-deploy smoke test for the live custom domain.
//
// A deploy can succeed while the site is still unreachable — the Worker uploads
// fine but the custom-domain route was never attached (that needs
// `Zone · Workers Routes · Edit` on the API token). No unit or build-time test
// can see that; only a request to the real hostname can. Hence this script.
//
// By default it SELF-SKIPS (exit 0) while the hostname is not reachable yet, so
// the repo does not show a red deploy before Cloudflare is fully wired up.
// Anything else — wrong content, 5xx, an expired certificate — is a real
// failure and exits non-zero.
//
// Once the domain is confirmed live, set SMOKE_REQUIRE_LIVE=1 (the deploy
// workflow does) and every self-skip becomes a hard failure instead. The skip
// path stays in the code for a site that has not been wired up yet.
//
// Override the target with argv[1] or SMOKE_URL, e.g.
//   node scripts/smoke.mjs https://expired.badssl.com/

const BASE_URL = process.argv[2]
  ?? process.env.SMOKE_URL
  ?? "https://zfb-example-corporate-website.takazudomodular.com/";

// Unique to this corporate demo's rendered output (dist/index.html <title> and
// header). If the page ever gets rebranded, this string must be updated.
const CONTENT_MARKER = "Northwind Studio";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 6_000;

const REQUIRE_LIVE = ["1", "true"]
  .includes((process.env.SMOKE_REQUIRE_LIVE ?? "").trim().toLowerCase());

// A custom domain that Cloudflare has only just attached is unreachable in a
// few distinguishable ways before it settles. Each is "not wired up yet", not
// an outage, so each is retried and then skipped:
//
//   DNS      — the record does not exist or does not answer yet.
//   NETWORK  — Cloudflare publishes the AAAA record before the A record, and
//              GitHub runners have no IPv6 route, so during that window every
//              candidate address is unreachable.
//   TLS      — the hostname already resolves to the edge but its certificate
//              has not been issued yet, so the handshake presents one that does
//              not cover this hostname.
const NOT_READY_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ENODATA",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

// An expired certificate is never a propagation state: a freshly issued edge
// certificate cannot already be expired, so this can only mean an established
// domain broke — exactly the outage this script exists to catch. It must fail
// even when a not-ready code appears alongside it.
const OUTAGE_ERROR_CODES = new Set(["CERT_HAS_EXPIRED"]);

// fetch wraps the underlying network error, so the code that identifies the
// failure sits below the thrown error rather than on it. Two shapes have to be
// walked. The usual one is the `cause` chain. The other is Happy Eyeballs,
// which races every resolved address and reports the pile-up as an
// AggregateError that carries no code of its own — the real per-address codes
// (ENETUNREACH during the IPv6-only window) hang off `.errors[]`. Walking only
// `cause` misses those entirely.
//
// Codes are deduplicated — Happy Eyeballs reports the same code once per
// resolved address, and repeating it adds nothing to the log line. The seen set
// plus the visit bound guard against a self-referential chain.
function errorCodes(error) {
  const codes = new Set();
  const seen = new Set();
  const queue = [error];

  for (let visits = 0; queue.length > 0 && visits < 50; visits++) {
    const e = queue.shift();
    if (!e || typeof e !== "object" || seen.has(e)) continue;
    seen.add(e);
    if (e.code) codes.add(e.code);
    if (e.cause) queue.push(e.cause);
    if (Array.isArray(e.errors)) queue.push(...e.errors);
  }

  return [...codes];
}

const hasCode = (error, codes) => errorCodes(error).some((c) => codes.has(c));

const isOutage = (error) => hasCode(error, OUTAGE_ERROR_CODES);
const isNotReady = (error) => !isOutage(error) && hasCode(error, NOT_READY_ERROR_CODES);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function skip(reason) {
  if (REQUIRE_LIVE) {
    fail(`${reason}\nSMOKE_REQUIRE_LIVE is set, so this site must be live — not skipping.`);
  }
  console.log(`::notice::Smoke test skipped — ${reason}`);
  process.exit(0);
}

function fail(reason) {
  console.log(`::error::Smoke test failed — ${reason}`);
  process.exit(1);
}

// Node's fetch validates TLS by default, so a resolved promise is itself proof
// of a valid certificate chain for this hostname — no extra TLS check needed.
function get(url) {
  return fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": "zfb-example-corporate-website-smoke" },
  });
}

async function fetchRoot() {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const more = attempt < MAX_ATTEMPTS;
    try {
      const response = await get(BASE_URL);
      // 5xx right after a deploy usually means the route exists but the edge is
      // not serving yet; retry before calling it a failure.
      if (response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        console.log(`Attempt ${attempt}/${MAX_ATTEMPTS}: HTTP ${response.status}${more ? ", retrying..." : ""}`);
      } else {
        return response;
      }
    } catch (error) {
      lastError = error;
      const codes = errorCodes(error);
      const detail = codes.length > 0 ? `${error.message} (${codes.join(", ")})` : error.message;
      console.log(`Attempt ${attempt}/${MAX_ATTEMPTS}: ${detail}${more ? ", retrying..." : ""}`);
    }

    if (more) await sleep(RETRY_DELAY_MS);
  }

  if (isNotReady(lastError)) {
    skip(
      `${BASE_URL} is not reachable yet (${errorCodes(lastError).join(", ")}). The custom domain `
      + "looks like it is still propagating — DNS, an AAAA record published ahead of the A record, "
      + "or the edge certificate can each lag a fresh deploy. This is also expected until the "
      + "Cloudflare API token carries Zone · Workers Routes · Edit and a deploy has run.",
    );
  }

  const codes = errorCodes(lastError);
  fail(
    `${BASE_URL} unreachable after ${MAX_ATTEMPTS} attempts: ${lastError?.message}`
    + (codes.length > 0 ? ` (${codes.join(", ")})` : ""),
  );
}

async function main() {
  console.log(`Smoke testing ${BASE_URL}${REQUIRE_LIVE ? " (SMOKE_REQUIRE_LIVE — skips are failures)" : ""}`);

  const root = await fetchRoot();

  if (root.status !== 200) {
    fail(`expected HTTP 200 from ${BASE_URL}, got ${root.status}`);
  }

  const contentType = root.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    fail(`expected an HTML content-type from ${BASE_URL}, got "${contentType}"`);
  }

  const html = await root.text();
  if (!html.includes(CONTENT_MARKER)) {
    fail(
      `${BASE_URL} returned HTML without the content marker "${CONTENT_MARKER}" `
      + `(${html.length} bytes) — the domain may be serving a different site.`,
    );
  }
  console.log(`OK  200 text/html containing "${CONTENT_MARKER}"`);

  // This demo has a single page (pages/index.tsx), so the hashed stylesheet is
  // the only real inner route. Its name is content-hashed, so it is discovered
  // from the served HTML rather than hardcoded.
  const styleLink = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*>/)
    ?? html.match(/<link\b[^>]*\.css"[^>]*>/);
  const styleHref = styleLink?.[0].match(/\bhref="([^"]+)"/)?.[1];
  if (!styleHref) {
    fail("no stylesheet <link> found in the served HTML — the build output looks wrong.");
  }

  const styleUrl = new URL(styleHref, BASE_URL).toString();
  const style = await get(styleUrl).catch((error) => {
    fail(`stylesheet ${styleUrl} could not be fetched: ${error.message}`);
  });
  if (style.status !== 200) {
    fail(`expected HTTP 200 from ${styleUrl}, got ${style.status}`);
  }
  const css = await style.text();
  if (css.length === 0) {
    fail(`${styleUrl} served an empty body.`);
  }
  console.log(`OK  200 ${styleHref} (${css.length} bytes)`);

  // Guards not_found_handling: "404-page" in wrangler.toml. If it were ever
  // flipped to "single-page-application", every unknown path would return
  // index.html with HTTP 200 and this assertion would catch it.
  const missingUrl = new URL(`/smoke-check-${Date.now()}-should-not-exist`, BASE_URL).toString();
  const missing = await get(missingUrl).catch((error) => {
    fail(`unknown-path probe ${missingUrl} could not be fetched: ${error.message}`);
  });
  if (missing.status !== 404) {
    fail(
      `expected HTTP 404 for the unknown path ${missingUrl}, got ${missing.status}. `
      + 'Check not_found_handling in wrangler.toml — "single-page-application" would return 200 here.',
    );
  }
  console.log(`OK  404 for an unknown path`);

  console.log(`\nSmoke test passed: ${BASE_URL} is live and serving this site.`);
}

await main();
