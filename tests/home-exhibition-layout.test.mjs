import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../site/styles.css", import.meta.url), "utf8");

test("the homepage exhibition keeps six covers in two three-card rows", () => {
  assert.equal((html.match(/class="art-card\b/g) || []).length, 6);
  assert.equal((html.match(/class="gallery-level\b/g) || []).length, 2);
  assert.equal((html.match(/class="gallery-shelf"/g) || []).length, 2);
  assert.match(css, /\.gallery-level__cards\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
});

test("each shelf supports its row instead of crossing through it", () => {
  const levelRule = css.match(/\.gallery-level\s*\{([^}]*)\}/s)?.[1] || "";
  const shelfRule = css.match(/\.gallery-shelf\s*\{([^}]*)\}/s)?.[1] || "";

  assert.match(levelRule, /padding-bottom:/);
  assert.match(shelfRule, /bottom:/);
  assert.doesNotMatch(css, /top:\s*calc\(50%/);
});
