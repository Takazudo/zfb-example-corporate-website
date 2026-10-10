import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve("dist");
const files = await readdir(root, { recursive: true });
const html = await readFile(resolve(root, "index.html"), "utf8");
assert.match(html, /Northwind Studio/);
assert.doesNotMatch(html, /<script\b/i, "the static site must not hydrate");
assert.ok(!files.some((file) => /\.(?:[cm]?js)$/i.test(file)), "no client JS assets");

const styles = [...html.matchAll(/<link\b[^>]*>/gi)]
  .map(([tag]) => tag.match(/\bhref="([^"]+\.css)"/)?.[1])
  .filter(Boolean);
assert.ok(styles.length > 0, "a stylesheet must be linked");
const css = (await Promise.all(styles.map(async (href) => {
  assert.match(href, /^\/assets\/styles-[^/]+\.css$/);
  const path = resolve(root, href.slice(1));
  assert.ok(path.startsWith(root + sep));
  return readFile(path, "utf8");
}))).join("\n");
assert.match(css, /--color-ink\s*:/, "authored global tokens survive");
assert.match(css, /\.[\w-]+_hero\b/, "scoped module styles survive");
assert.doesNotMatch(css, /tw-|--tw|@layer/, "no generated utility/reset layers");

const classes = new Set([...html.matchAll(/\bclass="([^"]*)"/g)]
  .flatMap(([, value]) => value.split(/\s+/)).filter(Boolean));
for (const name of classes) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(css, new RegExp(`\\.${escaped}(?![\\w-])`), `missing style for ${name}`);
}
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id));
for (const [, target] of html.matchAll(/\bhref="#([^"]+)"/g)) {
  assert.ok(ids.has(target), `missing navigation target #${target}`);
}
assert.ok(!(await readdir(".")).some((file) => /^zfb-tailwind-entry-.*\.css$/.test(file)));
console.log(`Static output passed: ${classes.size} styled classes, valid anchors, authored CSS, zero JS.`);
