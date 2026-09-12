import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../site/styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../site/script.js", import.meta.url), "utf8");

test("encyclopedia uses a four-card archive composition", () => {
  assert.match(html, /class="visual visual--archive encyclopedia-archive"/);
  assert.equal((html.match(/class="archive-card\b/g) || []).length, 4);
  assert.doesNotMatch(html, /archive-orbit|archive-grid/);
});

test("exhibition is split between copy and the six-disc display", () => {
  assert.match(html, /class="exhibition-copy"/);
  assert.match(html, /class="exhibition-display"/);
  assert.match(html, /class="gallery-grid"/);
});

test("the old page-edge glass and inline motion script are removed", () => {
  assert.doesNotMatch(html, /scroll-edge/);
  assert.equal((html.match(/<script/g) || []).length, 1);
});

test("visual system limits glass and supports user preferences", () => {
  assert.match(css, /--line-strong:/);
  assert.match(css, /--shadow-soft:/);
  assert.match(css, /\.site-header nav\s*\{[^}]*backdrop-filter:/s);
  assert.doesNotMatch(css, /\.archive-card\s*\{[^}]*backdrop-filter:/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/);
  assert.doesNotMatch(css, /\.portal-list a:hover\s*\{[^}]*padding/s);
});

test("one script owns panel state, restrained pointer response and reveals", () => {
  assert.match(js, /prefers-reduced-motion/);
  assert.match(js, /classList\.add\('is-revealed'\)/);
  assert.match(js, /classList\.toggle\('is-current'/);
  assert.equal((js.match(/new IntersectionObserver/g) || []).length, 1);
});
