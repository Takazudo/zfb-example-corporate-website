#!/usr/bin/env node
// Post-deploy smoke test for the live custom domain.
//
// A deploy can succeed while the site is still unreachable — the Worker uploads
// fine but the custom-domain route was never attached (that needs
// `Zone · Workers Routes · Edit` on the API token). No unit or build-time test
// can see that; only a request to the real hostname can. Hence this script.
//
// It SELF-SKIPS (exit 0) while the hostname does not resolve yet, so the repo
// does not show a red deploy before Cloudflare is fully wired up. Anything else
// — wrong content, 5xx, TLS failure on a hostname that DOES resolve — is a real
// failure and exits non-zero.

const BASE_URL = process.env.SMOKE_URL
  ?? "https://zfb-example-corporate-website.takazudomodular.com/";

// Unique to this corporate demo's rendered output (dist/index.html <title> and
// header). If the page ever gets rebranded, this string must be updated.
const CONTENT_MARKER = "Northwind Studio";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 6_000;

// A freshly attached custom domain briefly fails DNS resolution before it
// propagates, so these are retried rather than reported immediately.
const DNS_ERROR_CODES = new Set(["ENOTFOUND", "EAI_AGAIN", "ENODATA"]);

function errorCodes(error) {
  const codes = [];
  for (let e = error; e; e = e.cause) {
    if (e.code) codes.push(e.code);
  }
  return codes;
}

const isDnsError = (error) => errorCodes(error).some((c) => DNS_ERROR_CODES.has(c));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function skip(reason) {
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
      const detail = isDnsError(error) ? "hostname does not resolve" : error.message;
      console.log(`Attempt ${attempt}/${MAX_ATTEMPTS}: ${detail}${more ? ", retrying..." : ""}`);
    }

    if (more) await sleep(RETRY_DELAY_MS);
  }

  if (isDnsError(lastError)) {
    skip(
      `${BASE_URL} does not resolve yet. The custom domain is not attached — this is expected `
      + "until the Cloudflare API token carries Zone · Workers Routes · Edit and a deploy has run.",
    );
  }

  fail(`${BASE_URL} unreachable after ${MAX_ATTEMPTS} attempts: ${lastError?.message}`);
}

async function main() {
  console.log(`Smoke testing ${BASE_URL}`);

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
  const styleHref = html.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/)?.[1];
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
