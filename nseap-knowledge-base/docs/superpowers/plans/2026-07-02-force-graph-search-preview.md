# Force Graph Search Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将知识图谱改成基于真实项目关系的力导向图，并把飞书式搜索结果悬浮预览放回图谱场景。

**Architecture:** 后端 `GET /api/knowledge-graph` 输出文档节点、结构节点和显式关系边；前端图谱页消费这些节点，使用轻量力导向布局展示，并在图谱搜索时显示结果面板和预览卡。普通列表继续保留检索和详情，不承担飞书式图谱预览。

**Tech Stack:** Node.js 内置 HTTP 服务、`node:test`、原生 HTML/CSS/JS、现有 `support.js` 模板运行时。

---

### Task 1: 后端图谱关系测试

**Files:**
- Modify: `tests/settings-api.test.js`

- [ ] **Step 1: 写失败测试**

在现有 graph API 测试后补充：创建一个 `project`，带有 `concepts`、`skills`、`deliverables`，请求 `/api/knowledge-graph` 后必须返回结构节点，并用 `includes` 边连接项目。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`

Expected: 新测试失败，因为当前后端不会生成结构节点。

### Task 2: 后端图谱模型

**Files:**
- Modify: `server/server.js`
- Modify: `data/knowledge-db.json`

- [ ] **Step 1: 实现结构节点生成**

在 `buildKnowledgeGraph()` 中为项目条目的 `concepts`、`skills`、`deliverables` 生成 virtual nodes，并用 `includes` 边连接项目。

- [ ] **Step 2: 补齐 C2S 示例关系**

让 C2S 项目显式连接真实挑战、上传产出和 Metadata-First 最佳实践，保证演示图谱不是空关系。

- [ ] **Step 3: 运行测试确认通过**

Run: `npm test`

Expected: 所有测试通过。

### Task 3: 前端图谱交互

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: 去掉关键词硬连**

移除 `关键词关联` 自动连线，图谱只使用后端真实关系和结构节点。

- [ ] **Step 2: 增加轻量力导向布局**

用原生 JS 在 `buildGraphModel()` 内计算节点位置：连线拉近、节点排斥、中心吸引，支持选中节点高亮。

- [ ] **Step 3: 图谱内搜索面板**

在图谱视图上方放搜索结果面板，结果行悬浮显示预览卡，点击打开详情。

- [ ] **Step 4: 节点悬浮预览**

图谱节点 hover 时显示与搜索结果一致的预览信息，并高亮相关连线。

### Task 4: 文档更新与验证

**Files:**
- Modify: `DESIGN.md`
- Modify: `README.md`

- [ ] **Step 1: 更新设计方案**

说明图谱采用 Obsidian 式力导向图，关系来自显式项目结构；飞书式预览只放在图谱搜索场景。

- [ ] **Step 2: 验证**

Run:
- `node --check server/server.js`
- `npm test`
- 浏览器打开本地页面检查图谱搜索、节点悬浮和结果预览。
