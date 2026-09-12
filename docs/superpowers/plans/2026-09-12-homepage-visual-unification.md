# Rainy Prism Homepage Visual Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all five homepage panels under the approved “editorial archive × restrained glass” system while preserving content, links, exhibition data, and the record motif.

**Architecture:** Keep the existing static HTML/CSS/JavaScript structure and replace only homepage markup, presentation rules, and motion orchestration. CSS owns layout, materials, responsive sizing, and reduced-preference fallbacks; JavaScript only loads featured works, tracks the active panel, and applies one-time viewport entrance states.

**Tech Stack:** Semantic HTML, CSS Grid, CSS transitions/keyframes, vanilla JavaScript, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-homepage-visual-unification-design.md`

## Global Constraints

- Modify only the homepage; wiki articles, relationship network, timeline, exhibition interior, and editor stay unchanged.
- Preserve existing copy, links, selected-work data, role deep links, logo, six exhibition works, and record construction.
- Glass is limited to floating navigation and small functional controls.
- Use `cubic-bezier(.23, 1, .32, 1)` for UI ease-out and `cubic-bezier(.77, 0, .175, 1)` for on-screen movement.
- Support `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Verify 1280×720, 1440×900, and 1920×1080 desktop viewports.

---

### Task 1: Lock the homepage structure and design boundaries

**Files:**
- Modify: `tests/home-exhibition-layout.test.mjs`
- Create: `tests/homepage-visual-system.test.mjs`
- Modify: `site/index.html`

**Interfaces:**
- Consumes: existing `.panel`, navigation anchors, `.art-card`, and `loadHomeFeaturedWorks()` selectors.
- Produces: `.encyclopedia-archive`, `.archive-card`, `.exhibition-copy`, `.exhibition-display`, `.gallery-grid`, `.gallery-shelf`.

- [ ] **Step 1: Write failing structural tests**

Assert that `site/index.html` contains four archive cards, separate exhibition copy/display regions, six `.art-card` links, two shelf elements, no `.archive-orbit`, and no `.scroll-edge`.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/homepage-visual-system.test.mjs tests/home-exhibition-layout.test.mjs`

Expected: FAIL because the approved structure does not exist yet.

- [ ] **Step 3: Implement the semantic homepage markup**

Replace the encyclopedia grid/orbit with four labeled archive cards linked as one accessible visual; reorganize exhibition into left copy and right 3×2 display; place middle and bottom shelf spans after their corresponding card rows; remove the fixed scroll-edge element.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/homepage-visual-system.test.mjs tests/home-exhibition-layout.test.mjs`

Expected: PASS.

### Task 2: Implement the unified visual system

**Files:**
- Modify: `tests/homepage-visual-system.test.mjs`
- Modify: `site/styles.css`

**Interfaces:**
- Consumes: Task 1 class names.
- Produces: shared material, border, shadow, spacing, motion, focus, and panel-entry tokens.

- [ ] **Step 1: Add failing CSS contract tests**

Assert that navigation alone receives `backdrop-filter`, archive cards use the shared line/shadow tokens, exhibition uses the approved split columns, list hover does not animate padding, and both reduced-preference media queries exist.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/homepage-visual-system.test.mjs`

Expected: FAIL on missing tokens and old visual rules.

- [ ] **Step 3: Replace homepage CSS with the approved system**

Define shared tokens, keep the five one-screen panels, constrain header glass to its capsule, build the layered archive-card composition, implement the 32/68 exhibition split, place shelves under each row with a 2–4px overlap, normalize record/list styling, and use transform-based hover feedback.

- [ ] **Step 4: Add preference fallbacks and focus styles**

Stop positional/looping motion under reduced motion; make navigation nearly opaque under reduced transparency; gate hover motion to fine pointers; add `:focus-visible` outlines.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test tests/homepage-visual-system.test.mjs tests/home-exhibition-layout.test.mjs`

Expected: PASS.

### Task 3: Simplify and unify homepage motion

**Files:**
- Modify: `tests/homepage-visual-system.test.mjs`
- Modify: `site/script.js`
- Modify: `site/index.html`

**Interfaces:**
- Consumes: `.panel`, `.site-header`, `.archive-card`, `.art-card`, `.portal-list a`.
- Produces: `.is-current` and `.is-revealed` state classes; one active IntersectionObserver path.

- [ ] **Step 1: Add failing motion tests**

Assert that inline animation orchestration is removed, one script owns panel state, reduced-motion is respected in JavaScript, and reveal classes are applied once without blocking interaction.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/homepage-visual-system.test.mjs`

Expected: FAIL because motion is split between inline code and `site/script.js`.

- [ ] **Step 3: Consolidate JavaScript motion**

Move header tone, active navigation, page counter, restrained spectrum pointer response, and one-time reveals into `site/script.js`; remove the inline animation script; keep `loadHomeFeaturedWorks()` and role links unchanged.

- [ ] **Step 4: Verify script and tests**

Run: `node --check site/script.js && node --test tests/homepage-visual-system.test.mjs tests/home-exhibition-layout.test.mjs`

Expected: syntax exit 0 and all tests PASS.

### Task 4: Remove the prototype and synchronize the local homepage

**Files:**
- Delete: `prototypes/exhibition-split-preview.html`
- Delete: `tests/exhibition-split-preview.test.mjs`
- Sync to: `/Volumes/围巾猫/雨棱镜页面设计/rainy-prism-home/index.html`
- Sync to: `/Volumes/围巾猫/雨棱镜页面设计/rainy-prism-home/styles.css`
- Sync to: `/Volumes/围巾猫/雨棱镜页面设计/rainy-prism-home/script.js`

**Interfaces:**
- Consumes: verified formal `site/` files.
- Produces: identical formal and local homepage implementations.

- [ ] **Step 1: Delete prototype-only artifacts**

Use `apply_patch` to remove the preview HTML and its dedicated test.

- [ ] **Step 2: Copy the three verified formal homepage files to the local runtime folder**

Use a non-destructive file copy; do not replace exhibition data or assets.

- [ ] **Step 3: Verify synchronization**

Run three `cmp` checks for HTML, CSS, and JavaScript.

Expected: all exit 0.

### Task 5: Browser verification at three desktop sizes

**Files:**
- Modify only if a measured failure requires a scoped correction: `site/styles.css`, `site/index.html`, or `site/script.js`

**Interfaces:**
- Consumes: completed homepage.
- Produces: measured viewport evidence and final screenshots.

- [ ] **Step 1: Open the local homepage and measure each panel at 1280×720**

Verify each panel equals one viewport; six exhibition cards and both shelves remain inside the panel; no header overlap occurs.

- [ ] **Step 2: Repeat at 1440×900 and 1920×1080**

Verify bounds, visible labels, link targets, active navigation, and archive-card composition.

- [ ] **Step 3: Verify interaction and preference states**

Check keyboard focus, CD/archive hover, reduced-motion, and reduced-transparency behavior.

- [ ] **Step 4: Run the complete final verification**

Run: `node --check site/script.js && node --test tests/*.test.mjs && git diff --check`

Expected: all commands exit 0 and no test failures.

