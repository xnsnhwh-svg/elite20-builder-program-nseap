# NSEAP 知识认知细胞 MVP

这是 Elite20 Builder Program 第 6 组 Knowledge Team 的 MVP 交付。

我们的目标不是在第一版收集所有课程资料，而是设计并验证一个可以继续扩展为正式 Knowledge Repository 的 **知识认知细胞（Knowledge Cognitive Cell）产品方案**。

## 轻量前后端 MVP

当前推荐演示入口是轻量前后端版本：

```bash
cd nseap-knowledge-base
npm run dev
```

然后打开：

```text
http://127.0.0.1:8787/index.html
```

这一版用于验证完整链路：

```text
前端页面
-> 后端 API
-> 本地 JSON 数据库
-> 搜索与分类规则
-> 返回结果给前端展示
```

当前数据库文件是：

```text
data/knowledge-db.json
```

v0.2 数据库里包含真实案例和上传生成的草稿。演示时可以说明：这不是把资料写死在 HTML 里，而是后端从数据库读取真实项目资料，再通过接口交给前端展示、搜索、编辑和归档。

当前 API：

```text
GET  /api/health
GET  /api/llm/status
GET  /api/settings
PATCH /api/settings
GET  /api/knowledge
GET  /api/knowledge?includeArchived=true
GET  /api/search?q=大数据
GET  /api/search?q=大数据&includeArchived=true
GET  /api/knowledge-graph
GET  /api/guided-path?entryId=kb-project-002
GET  /api/knowledge/kb-project-002
PATCH /api/knowledge/:id
DELETE /api/knowledge/:id
GET  /api/knowledge/:id/relationships
POST /api/knowledge/:id/relationships
POST /api/knowledge
POST /api/upload
```

`POST /api/upload` 会把上传文件保存到 `data/uploads/`，同时生成一条 `draft` 知识草稿写入 `data/knowledge-db.json`。系统会优先抽取正文：文本文件直接读取，`.docx` 会从 Word XML 中抽取正文，`.pdf` 会尝试读取文本流。抽取到的正文会进入 LLM 或规则分类流程。

`PATCH /api/knowledge/:id` 用来补充或修改草稿的 metadata，例如关键词、概念、技能、适用对象和状态。

`POST /api/knowledge/:id/relationships` 用来维护显式关系，例如某个项目案例支持某个挑战、某个挑战使用某个 Prompt。关系会写入知识条目，而不是只藏在正文里。

`GET /api/knowledge-graph` 用来把知识条目和显式关系整理成图谱数据，返回节点、连线和统计信息，供前端图谱视图或后续 Agent 使用。

`DELETE /api/knowledge/:id` 当前执行的是“归档”，不是硬删除。归档条目默认从浏览列表和搜索结果中隐藏，但后端仍保留详情，方便后续恢复、审计或做回收站。

`GET /api/guided-path?entryId=...` 用来生成“老师带练”路径。当前版本先根据知识类型和显式关系生成规则模板路径，例如挑战 -> Prompt -> 项目案例 -> 最佳实践 -> 行动检查。后续提供 LLM Key 后，可以把每一步的老师讲解升级为模型生成。

### LLM 自动分类

上传流程已经预留 LLM 分析层。没有配置 Key 时，系统会使用规则兜底生成草稿；配置 Key 后，上传带有可读正文的 `.txt`、`.md`、`.csv`、`.json`、`.docx` 和文本型 `.pdf` 文件时，会调用 LLM 自动生成类型、摘要、关键词、概念、技能和适用对象。

前端右上角“设置”可以配置 OpenAI-compatible 的 Base URL、模型名称和 API Key。后端会把本地运行配置保存到：

```text
data/runtime-config.json
```

页面只显示 Key 是否已配置，不会把 Key 明文返回给前端。

Windows 命令行示例：

```bat
set LLM_API_KEY=你的key
set LLM_MODEL=gpt-4o-mini
npm run dev
```

也可以配置 OpenAI-compatible 服务：

```bat
set LLM_BASE_URL=https://api.openai.com/v1
set LLM_API_KEY=你的key
set LLM_MODEL=gpt-4o-mini
npm run dev
```

当前轻量 MVP 已经支持 `.docx` 正文抽取和基础 PDF 文本流抽取。扫描版 PDF 或复杂编码 PDF 暂时仍需要后续接入 OCR 或更专业的 PDF 解析器。

## Demo App

静态 Demo 仍然保留为备用入口：

```text
app/index.html
```

它用于验证未来 FDE Workbench 中两个能力的产品逻辑：

- 知识仓库（Knowledge Repository）
- 提示词工作室（Prompt Studio）

Demo 当前可以：

- 浏览知识条目
- 按课程、挑战、提示词、项目、Agent 等分类筛选
- 搜索标题、关键词、标签、概念、技能、适用对象和 Markdown 文件内容
- 搜索结果悬浮预览，不进入详情也能快速判断内容是否相关
- 切换到知识图谱视图，查看知识节点和关系连线
- 查看每个条目的元数据、关系、概念、技能
- 点击“开始带练”，按老师式路径理解和复用一条知识
- 展示“场景 -> 本体 -> 流程 -> 技能 -> 评估 -> 学习 -> 知识增长”
- 从 Demo 跳转到源 Markdown 文件

更新搜索索引：

```bash
node scripts/build-search-index.js
```

以后新增知识文件时，不需要改前端搜索代码。只要在 Markdown frontmatter 中补充 `keywords`、`tags`、`concepts`、`skills` 等字段，然后重新生成搜索索引即可。

静态方式本地运行：

```bash
cd nseap-knowledge-base/app
python -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

## 项目定位

NSEAP Knowledge Base 不是普通文件夹。在 Cognitive Cell 架构里，它是一个面向知识组织、知识检索、知识增长的认知细胞。

详细设计方案见：

```text
DESIGN.md
docs/backend-implementation-baseline.md
```

产品设计目标是一个正式的 Knowledge Repository。当前 v0.1 先通过 Markdown、YAML metadata、JSON Schema、搜索索引和静态 Demo 验证知识模型、检索方式、关系结构和演示流程。

在 NSEAP Technical Series 的路线里，它也是未来 FDE Workbench 中 Knowledge Repository 和 Prompt Studio 的产品雏形。

未来版本中，它可以继续演化成 Knowledge Librarian Agent，具备本体、技能、长期记忆、评估和持续改进能力。

## MVP 交付物

- `app/`：可演示的静态 Demo App
- `DESIGN.md`：详细设计方案
- `docs/backend-implementation-baseline.md`：后续后端实现基线
- `scripts/build-search-index.js`：从 Markdown 知识文件生成搜索索引
- `knowledge-base/`：Markdown 知识源
- `templates/`：知识条目、提示词、FAQ、项目案例等模板
- `schemas/`：面向 Agent-ready / graph-ready metadata 的 JSON Schema
- `CONTRIBUTING.md`：GitHub 提交流程
- `docs/builder-workflow.md`：对齐老师给的 Builder Workflow
- `docs/cognitive-cell-alignment.md`：对齐 Cognitive Cell 架构
- `docs/standards-mapping.md`：对齐 P2807.8、P3394、P3428 等参考方向
- `docs/nseap-technical-series-alignment.md`：对齐 OKF、FDE Workbench、Knowledge Repository、Prompt Studio
- `docs/capability-levels.md`：定义 L0-L5 能力等级
- `PRESENTATION.md`：汇报说明

## 目录结构

```text
nseap-knowledge-base/
  README.md
  MVP.md
  CONTRIBUTING.md
  PRESENTATION.md
  app/
  docs/
  knowledge-base/
  templates/
  schemas/
  examples/
```

## Builder Workflow 对齐

本 MVP 遵守老师给的 Builder Workflow：

```text
发现问题
-> 提出方案
-> AI 辅助开发
-> GitHub 提交
-> Peer Review
-> Agent Review
-> Merge
-> Documentation
-> Release
```

我们当前对应的是：发现“只有 Markdown 不够支撑知识产品”的问题，提出“Knowledge Repository 产品方案 + v0.1 Demo 验证”的方案，并用 AI 辅助完成第一版实现。

## 知识增长流程

每个重要知识条目都尽量连接到这个流程：

```text
场景
-> 本体
-> 流程
-> 技能
-> 评估
-> 学习
-> 知识增长
```

这让知识库不是简单存资料，而是能把课程、挑战、提示词、项目案例持续沉淀成可复用的认知资产。
