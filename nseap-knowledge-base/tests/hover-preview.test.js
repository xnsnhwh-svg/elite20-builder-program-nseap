const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "app", "index.html"), "utf8");

function previewStyleFor(bindingName) {
  const marker = `<sc-if value="{{ ${bindingName} }}"`;
  const start = indexHtml.indexOf(marker);
  assert.notEqual(start, -1, `${bindingName} preview block should exist`);

  const block = indexHtml.slice(start, start + 700);
  const styleMatch = block.match(/<div[^>]*style="([^"]+)"/);
  assert.ok(styleMatch, `${bindingName} preview surface should expose a style attribute`);
  return styleMatch[1];
}

test("hover preview surfaces do not intercept pointer movement", () => {
  const listPreviewStyle = previewStyleFor("hoverPreviewVisible");
  const graphPreviewStyle = previewStyleFor("graph.previewVisible");

  assert.match(listPreviewStyle, /pointer-events\s*:\s*none/i);
  assert.match(graphPreviewStyle, /pointer-events\s*:\s*none/i);
});

test("knowledge graph uses local D3 SVG instead of canvas ForceGraph", () => {
  assert.match(indexHtml, /<script src="\.\/vendor\/d3\.min\.js"><\/script>/);
  assert.doesNotMatch(indexHtml, /<script src="\.\/vendor\/force-graph\.min\.js"><\/script>/);
  assert.match(indexHtml, /typeof window\.d3 !== "object"/);
  assert.doesNotMatch(indexHtml, /new window\.ForceGraph/);
});

test("D3 graph renderer follows force graph skill primitives", () => {
  for (const primitive of [
    "d3.forceSimulation",
    "d3.forceLink",
    "d3.forceManyBody",
    "d3.forceCenter",
    "d3.forceCollide",
    "d3.zoom",
    "d3.drag",
    "svg.selectAll(\"*\").remove",
    "marker-end",
    "edgeLabel"
  ]) {
    assert.match(indexHtml, new RegExp(primitive.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("graph data exposes skill-aligned node and edge fields", () => {
  assert.match(indexHtml, /node_type:node\.type/);
  assert.match(indexHtml, /label:node\.title/);
  assert.match(indexHtml, /relation:link\.predicate/);
});

test("graph defaults to Obsidian-style restrained visual language", () => {
  assert.match(indexHtml, /obsidianGraphPalette\(\)/);
  assert.match(indexHtml, /background:"#F7F8FA"/);
  assert.match(indexHtml, /nodeFill:"#8B93A7"/);
  assert.match(indexHtml, /active:"#6C7CFF"/);
  assert.doesNotMatch(indexHtml, /node\.color \|\| "#E6F3F0"/);
  assert.doesNotMatch(indexHtml, /"#6E9D94"/);
});

test("graph does not expand project internals by default", () => {
  assert.match(indexHtml, /graphStructureExpanded:false/);
  assert.match(indexHtml, /const includeStructure = !!S\.graphStructureExpanded/);
  assert.match(indexHtml, /if\(includeStructure\) \{\s*for \(const entry of docs\.values\(\)\)/);
  assert.match(indexHtml, /graphStructureToggleLabel/);
});

test("relationship predicates render as Chinese labels in graph and detail views", () => {
  for (const label of ["包含", "实践", "提示词", "支持", "需要", "评估", "相关"]) {
    assert.match(indexHtml, new RegExp(label));
  }
  assert.match(indexHtml, /predicate:this\.graphRelationLabel\(r\.predicate\)/);
  assert.match(indexHtml, /label:predicateLabel\(link\.predicate\)/);
});

test("LLM status and model switcher are visible in the frontend", () => {
  assert.match(indexHtml, /当前模型/);
  assert.match(indexHtml, /settingsProviderLabel/);
  assert.match(indexHtml, /modelQuickOptions/);
  assert.match(indexHtml, /Qwen\/Qwen2\.5-7B-Instruct/);
  assert.match(indexHtml, /deepseek-ai\/DeepSeek-V3/);
  assert.match(indexHtml, /onSettingsModelQuickSelect/);
});

test("upload flow exposes synchronized progress stages", () => {
  assert.match(indexHtml, /uploadProgress/);
  assert.match(indexHtml, /role="progressbar"/);
  assert.match(indexHtml, /readFileWithProgress/);
  assert.match(indexHtml, /XMLHttpRequest/);
  assert.match(indexHtml, /xhr\.upload\.onprogress/);
  assert.match(indexHtml, /AI 分析/);
});

test("upload success view exposes the knowledge processing card", () => {
  assert.match(indexHtml, /知识加工单/);
  assert.match(indexHtml, /processingCard/);
  assert.match(indexHtml, /classificationReason/);
  assert.match(indexHtml, /coreProblem/);
  assert.match(indexHtml, /suggestedRelations/);
  assert.match(indexHtml, /nextActions/);
});

test("detail view explains the module value before metadata fields", () => {
  assert.match(indexHtml, /知识加工结果总览/);
  assert.match(indexHtml, /这份资料是什么/);
  assert.match(indexHtml, /系统加工出了什么/);
  assert.match(indexHtml, /它能服务谁/);
  assert.match(indexHtml, /下一步建议/);
  assert.match(indexHtml, /processingOverview/);
  assert.ok(
    indexHtml.indexOf("知识加工结果总览") < indexHtml.indexOf("适用对象 · Audience"),
    "processing overview should appear before raw metadata fields"
  );
});

test("guided practice opens a dedicated document coaching page", () => {
  assert.match(indexHtml, /isGuided/);
  assert.match(indexHtml, /文档带练页/);
  assert.match(indexHtml, /原文阅读地图/);
  assert.match(indexHtml, /对应知识字段/);
  assert.match(indexHtml, /guidedReadingMap/);
  assert.match(indexHtml, /guidedFieldMappings/);
  assert.match(indexHtml, /view:"guided"/);
});

test("frontend dc script has valid JavaScript syntax", () => {
  const start = indexHtml.indexOf("<script type=\"text/x-dc\"");
  assert.notEqual(start, -1, "dc script should exist");

  const scriptStart = indexHtml.indexOf(">", start) + 1;
  const end = indexHtml.indexOf("</script>", scriptStart);
  assert.ok(scriptStart > 0 && end > scriptStart, "dc script body should exist");

  assert.doesNotThrow(() => new Function(indexHtml.slice(scriptStart, end)));
});
