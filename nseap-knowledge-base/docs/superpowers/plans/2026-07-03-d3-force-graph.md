# D3 Force Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Canvas `force-graph` knowledge graph with a D3 SVG force-directed graph following `force-graph-skill.md`.

**Architecture:** Keep the existing backend and `buildGraphModel()` data assembly. Swap the graph renderer in `app/index.html` so it builds an SVG inside `#knowledge-force-graph`, runs `d3.forceSimulation`, and wires hover/click/zoom/drag interactions back into the existing UI state.

**Tech Stack:** Static HTML/DC runtime, local vendored D3 v7, SVG, D3 force/zoom/drag.

---

### Task 1: Lock Expected D3 Behavior With Tests

**Files:**
- Modify: `tests/hover-preview.test.js`
- Modify: `package.json`

- [ ] Add assertions that `app/index.html` loads `./vendor/d3.min.js`, uses `window.d3`, and no longer loads `force-graph.min.js`.
- [ ] Add assertions that `renderForceGraph()` uses `d3.forceSimulation`, `forceLink`, `forceManyBody`, `forceCenter`, `forceCollide`, `zoom`, and `drag`.
- [ ] Add assertions that graph data exposes skill-aligned fields: `node_type`, `label`, and `relation`.
- [ ] Run `node --test tests/hover-preview.test.js` and confirm the D3 assertions fail before implementation.

### Task 2: Add Local D3 Vendor Asset

**Files:**
- Create: `app/vendor/d3.min.js`
- Modify: `app/index.html`

- [ ] Add `app/vendor/d3.min.js` from a stable D3 v7 build.
- [ ] Replace the old `force-graph.min.js` script tag with `d3.min.js`.
- [ ] Keep this dependency local so the demo does not rely on an external CDN at presentation time.

### Task 3: Replace Canvas Renderer With D3 SVG Renderer

**Files:**
- Modify: `app/index.html`

- [ ] Update `destroyForceGraph()` to stop D3 simulation, remove resize listeners, and clear the graph container.
- [ ] Replace `renderForceGraph()` with a D3 SVG renderer:
  - Clear and recreate `<svg>`.
  - Add `<g>` root for zoom/pan.
  - Add arrow marker definitions.
  - Draw links, link labels, nodes, halos, circles, and labels.
  - Run `d3.forceSimulation()` with link, charge, center, and collision forces.
  - Add drag behavior and click/hover events.
  - Fit the graph after the simulation settles.
- [ ] Remove Canvas-only helper methods that are no longer used.

### Task 4: Verify Functionally And Visually

**Files:**
- Test: `tests/hover-preview.test.js`
- Test: `tests/settings-api.test.js`

- [ ] Run `npm test` and confirm all tests pass.
- [ ] Open `http://127.0.0.1:8787/`, switch to graph mode, and confirm there is an SVG graph, visible nodes/links, hover preview, zoom, and node click.
- [ ] Capture browser evidence with Playwright/Chrome if available.
