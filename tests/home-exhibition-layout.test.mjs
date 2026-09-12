import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../site/styles.css", import.meta.url), "utf8");

test("the six exhibition covers are capped by viewport height", () => {
  const galleryRule = css.match(/\.gallery-row\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(galleryRule, /grid-template-columns:\s*repeat\(3,[^;]*svh/);
  assert.match(galleryRule, /justify-content:\s*center/);
});

test("the exhibition heading leaves room for both cover rows", () => {
  const panelRule = css.match(/\.panel--exhibition\s*\{([^}]*)\}/)?.[1] || "";
  const headingRule = css.match(/\.section-heading\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(panelRule, /padding:\s*clamp\(/);
  assert.match(headingRule, /margin-bottom:\s*clamp\(/);
});
