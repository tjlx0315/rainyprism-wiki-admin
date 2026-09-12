import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intro = readFileSync(new URL("../site/intro.html", import.meta.url), "utf8");

test("intro keeps the rain scene, flower and soundtrack", () => {
  assert.match(intro, /<canvas id="scene"/);
  assert.match(intro, /class="flowers"/);
  assert.equal((intro.match(/<audio/g) || []).length, 2);
});

test("intro introduces the Rainy Prism identity before entering", () => {
  assert.match(intro, /class="intro-brand"/);
  assert.match(intro, /RAINY PRISM/);
  assert.match(intro, /一切的一切都已向前铺陈/);
  assert.match(intro, /class="enter-card"/);
  assert.match(intro, /href="index\.html"/);
});

test("intro uses the homepage glass and accessibility preferences", () => {
  assert.match(intro, /\.enter-card\s*\{[^}]*backdrop-filter:/s);
  assert.match(intro, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(intro, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/);
  assert.match(intro, /:focus-visible/);
});
