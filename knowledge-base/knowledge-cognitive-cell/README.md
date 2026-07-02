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

v0.2 数据库里先只放一个真实案例：`C2S 大数据应用挑战项目案例`。这样演示时可以说明：这不是把资料写死在 HTML 里，而是后端从数据库读取真实项目案例，再通过接口交给前端展示和搜索。

当前 API：

```text
GET  /api/health
GET  /api/llm/status
GET  /api/settings
PATCH /api/settings
GET  /api/knowledge
GET  /api/search?q=大数据
GET  /api/knowledge/kb-project-002
PATCH /api/knowledge/:id
DELETE /api/knowledge/:id
POST /api/knowledge
POST /api/upload
```

`POST /api/upload` 会把上传文件保存到 `data/uploads/`，同时生成一条 `draft` 知识草稿写入 `data/knowledge-db.json`。这对应正式系统里的第一步：先接收学生、老师或 Builder 的原始资料，再由 Knowledge Team 补充 metadata、关系和审核状态。

`PATCH /api/knowledge/:id` 用来补充或修改草稿的 metadata，例如关键词、概念、技能、适用对象和状态。

`DELETE /api/knowledge/:id` 用于在浏览详情页删除不需要保留的知识条目。MVP 阶段采用硬删除，正式版本建议升级为归档或回收站机制。

### LLM 自动分类

上传流程已经预留 LLM 分析层。没有配置 Key 时，系统会使用规则兜底生成草稿；配置 Key 后，上传带有可读正文的 `.txt`、`.md`、`.csv`、`.json` 等文件时，会调用 LLM 自动生成类型、摘要、关键词、概念、技能和适用对象。

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

当前轻量 MVP 对 `.docx`、`.pdf` 这类二进制文件只会保存文件并生成草稿；要让 LLM 读懂 Word/PDF 正文，下一步需要接入文件正文抽取器。

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
- 查看每个条目的元数据、关系、概念、技能
- 展示“场景 -> 本体 -> 流程 -> 技能 -> 评估 -> 学习 -> 知识增长”
- 从 Demo 跳转到源 Markdown 文件

更新搜索索引：

```bash
node scripts/build-search-index.js
```

以后新增知识文件时，不需要改前端搜索代码。只要在 Markdown frontmatter 中补充 `keywords`、`tags`、`concepts`、`skills` 等字段，然后重新生成搜索索引即可。

静态方式本地运行：

```bash
cd knowledge-base/knowledge-cognitive-cell/app
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
knowledge-base/knowledge-cognitive-cell/
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

## 方向校验

本模块对应 **Team 6 Knowledge Base Building**，服务 NSEAP AI Learning Operating System 的知识层。它的作用不是单独做一个文档库，而是把课程、挑战、提示词、FAQ、最佳实践和项目案例沉淀成可检索、可复用、未来可被 Agent 调用的结构化知识资产。

当前 v0.1 MVP 已完成：

- Knowledge Cognitive Cell 静态 Demo
- Markdown 知识源目录
- KnowledgeItem metadata schema
- FAQ / Prompt / Best Practice / Project Case 模板
- 搜索索引生成脚本
- Builder Workflow、Cognitive Cell 和 NSEAP 标准方向对齐说明

与其他 Builder Team 的接口：

- Curriculum Team：课程内容可以沉淀为 Course Knowledge。
- Challenge Team：Challenge、Rubric、常见错误可以沉淀为 Challenge Knowledge。
- Agent Team：Agent 可以读取知识条目作为提示词和评审上下文。
- Ontology Team：知识条目可以映射到 Concept、Skill、Assessment 等本体节点。
- Platform Team：后续可以把当前静态 Demo 升级为网站、数据库和后台管理能力。
- Demo Team：可以把本模块作为 NSEAP 知识层的展示样例。

下一步计划：

- 接入更多真实课程资料和优秀项目案例。
- 补充 Challenge / Rubric / Agent 相关知识条目。
- 为 Agent 检索增加更清晰的字段和接口约定。
- 从 v0.1 静态 Demo 继续演化到可维护、可部署的 Knowledge Repository。

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
