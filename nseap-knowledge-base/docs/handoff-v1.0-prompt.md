# 任务交接提示词：NSEAP 知识认知细胞 V1.0

## 你的任务

接手 `nseap-knowledge-base` 子目录，继续推进 V1.0 Knowledge Repository。V0.3 和后端数据层地基已全部完成，你不需要重做这些，直接在上面建。

---

## 仓库位置

```
/Users/yinzhenyu1/Desktop/Elite20/nseap-knowledge-base/
```

主分支：`main`，最新提交：`62efc83`。

---

## 当前状态（已完成，不要改动）

**V0.3 已全部达标（commit `8989df7`）：**
- `GET /api/agent/context`：Agent 检索接口，trust 排序 + citation + role 过滤
- `scripts/export-knowledge.js`：Markdown 双向同步（库→md 回写，frontmatter-only）
- 6 条核心条目已推 stable；状态分布 stable 6 / sample 6 / draft 5
- 状态枚举对齐 DESIGN 8.3（sample/deprecated 接入 validTransitions）
- 测试 23/23 全绿，版本 0.3.0

**SQLite 后端地基已落（commit `62efc83`）：**
- `server/store.js`：`node:sqlite` 存储层（零第三方依赖）
  - 表：`knowledge_items`、`knowledge_item_values`、`knowledge_relationships`、`knowledge_revisions`、`db_singletons`
  - `loadDb()` / `saveDb()` 与旧 JSON 库 byte 级无损兼容（`doc_json` 列），API 契约不变
  - `knowledge_revisions`：每次内容哈希变化自动记录一条修订快照
- `server/server.js`：`readDb`/`writeDb` 委托给 SQLite；新增 `GET /api/knowledge/:id/revisions` 端点
- 测试改为临时 SQLite 隔离；24/24 全绿
- `data/knowledge.db` 已加进 `.gitignore`（runtime 库不入 git）
- `knowledge-db.json` 降级为自动生成的镜像，供 GitHub review 和 import/export 脚本使用

---

## 你需要做的：V1.0 剩余工作

按 `DESIGN.md` 第 13 章，V1.0 目标是「成为 NSEAP 的正式知识仓库能力」，还差以下几块：

### 优先级 1：工作台前端（工作量最大）

目前前端是 `app/index.html`（单文件，约 234KB）。需要在现有前端基础上，把以下后端能力接进 UI：

1. **修订历史面板**：在条目详情页加一个「历史」标签，调 `GET /api/knowledge/:id/revisions`，展示修订时间线（revisionId / status / createdAt / contentHash 前 8 位）。
2. **Agent 检索预览面板**：现有「看 Agent 能检索什么」入口（`index.html` 约第 161 行）目前喂的是 `embedded-data.js` 里的静态假数据，需要改为调真实 `GET /api/agent/context?q=&role=&type=&limit=` 端点，展示 citation、trust 排序、relationships。这是一个只读展示位，不需要做交互编辑。
3. **`sample`/`deprecated` 状态按钮**：现有状态流转 UI 只暴露了 draft/review/stable/归档，需要补上 sample→review、stable→deprecated 的流转按钮。

前端所有 API 调用走 `http://127.0.0.1:8787`，无认证。调用模式参考 `app/index.html` 里现有的 fetch 写法。

### 优先级 2：补 `agentNotes` 内容

`server/store.js` 和 schema 已有 `agentNotes` 字段，但 17 条数据里 0 条有实际内容。需要：
- 打开 `data/knowledge-db.json`，给每条条目补写 `agentNotes`（告诉 Agent：何时检索这条、能用来回答什么、不能用于什么）
- 格式参考 `nseap-knowledge-base/schemas/knowledge-item.schema.json` 的 `agentNotes` 字段描述
- 补完后运行 `npm run import:md` 同步进 SQLite

### 优先级 3：新增 Rubric 类型

Challenge 校验和评审依赖 Rubric，目前 `server/server.js` 的 `allowedTypes` 里没有。需要：
- 在 `server/server.js` 的 `allowedTypes` Set 里加 `"rubric"`
- 在 `nseap-knowledge-base/schemas/` 下新建 `rubric.schema.json`（参考现有 `knowledge-item.schema.json` 格式）
- 在 `nseap-knowledge-base/templates/` 下新建 `rubric-template.md`（参考现有模板格式）
- 在 `allowedPredicates` 里加 `"assessedBy"`（challenge → assessedBy → rubric，这个谓词已存在，确认不重复）

---

## 运行方式

```bash
cd nseap-knowledge-base
npm run dev      # 启动服务，http://127.0.0.1:8787
npm test         # 应 24/24 全绿
npm run import:md  # md → JSON → SQLite 同步
npm run export:md  # SQLite → JSON → md frontmatter 回写
```

---

## 关键文件速查

| 文件 | 说明 |
|------|------|
| `DESIGN.md` | 产品设计方案，所有决策的唯一依据 |
| `server/store.js` | SQLite 存储层（新建，本次核心改动） |
| `server/server.js` | HTTP 服务，readDb/writeDb 委托给 store |
| `app/index.html` | 前端单文件（约 234KB），所有 UI 在这里 |
| `data/knowledge-db.json` | JSON 镜像（git 追踪，供 review/import/export） |
| `data/knowledge.db` | SQLite 运行时真源（gitignored，不入库） |
| `tests/settings-api.test.js` | 主测试文件，24 个用例，每次改动后要保持全绿 |

---

## 注意事项

1. **每次改完跑 `npm test`，保持 24/24 全绿再提交。**
2. **不要改 `readDb`/`writeDb` 的对象结构**，否则会破坏所有 API。
3. `data/knowledge.db` 不存在时，服务首次启动会自动从 `data/knowledge-db.json` 播种。如果手动改了 JSON 但服务还在跑，需要 `npm run import:md` 同步。
4. `DESIGN.md` 里明确列为「第一阶段不做」的功能（完整知识图谱推理、自动评分、完整 Agent 编排、完整 FDE Workbench）不要提前做。
