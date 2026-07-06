# NSEAP 知识认知细胞（Knowledge Cognitive Cell）— 产品说明

> Elite20 Builder Program · 第 6 组 Knowledge Team
> 版本：v0.2 轻量前后端 MVP · 对应能力等级：L2（标准化知识库），迈向 L3（Agent-Ready）

---

## 一、产品是什么

NSEAP AI Learning Operating System 共有六大模块：课程、挑战库、学习平台、Agent 库、本体体系、知识库。**知识认知细胞（Knowledge Cognitive Cell）是第六模块——知识层。**

它不是普通文件夹，也不是文档目录，而是一个有 Identity、Capability、Interface 的结构化知识仓库。它的产品公式是：

```
Knowledge Cognitive Cell
= Knowledge Repository          （知识仓库）
+ Prompt Studio Seed            （提示词工作室雏形）
+ Metadata Search               （元数据优先检索）
+ Relationship Management       （知识关系管理）
+ Agent Retrieval Context       （Agent 检索上下文）
+ Knowledge Growth Loop         （知识增长闭环）
```

### 当前形态

当前 v0.2 MVP 已从静态 Demo 升级为轻量前后端版本：前端页面 + Node.js API + 本地 JSON 数据库 + 文件上传 + metadata 编辑 + 显式关系管理 + 知识图谱 + 老师带练路径。它验证的不是最终产品形态，而是“真实资料如何进入知识库、如何被分类、如何被检索、如何形成关系、如何帮助用户快速复用”的完整链路。

当前版本已经放入真实 C2S 项目案例，并支持上传 Word / Markdown / 文本型 PDF 等资料生成知识草稿。没有配置 LLM Key 时，系统使用规则兜底生成草稿；配置 OpenAI-compatible Key 后，可以让上传资料进入 LLM 自动分类流程，生成类型、摘要、关键词、概念、技能和适用对象。

### 本轮体验复盘后的设计重点

老师提醒我们要更关注目标用户和用户体验，因此本产品不应只强调“知识分类规则”，还要强调用户能否快速完成一次有价值的操作。后续每次迭代都用四个问题检查：

1. 这个功能主要给谁用？
2. 用户进入页面后第一步是否一眼看懂？
3. 系统是否解释了为什么这样分类、推荐或关联？
4. 用户完成当前动作后，是否知道下一步怎么复用或继续完善？

因此，当前 MVP 的体验目标可以概括为：

```text
3 分钟内完成：
上传一份资料
-> 自动生成知识草稿
-> 看懂系统分类和 metadata
-> 搜到相关知识
-> 通过图谱或老师带练理解关系
-> 形成下一步复用动作
```

### 成熟度定位

| 等级 | 名称 | 说明 |
|---|---|---|
| L0 | 散落文档 | 文件存在，无共享结构 |
| L1 | 文档库 | 文件分目录，人可阅读 |
| **L2** | **标准化知识库** | **模板 + metadata + 稳定分类 + 轻量前后端 MVP ← 当前阶段** |
| L3 | Agent-Ready 知识库 | Agent 可按 type/audience/tags/concepts/skills 检索 ← 下一目标 |
| L4 | 知识认知细胞 | 有明确 Identity / Capability / Interface / Contract |
| L5 | 进化型知识细胞 | 使用反馈 + 评估 + 长期记忆 + KSTAR 自我改进 → Knowledge Librarian Agent |

### 信息架构

```
Knowledge Repository
├─ 00-overview        系统说明与使用指南
├─ 01-course          课程知识（Syllabus / Weekly Plan / Lecture Notes）
├─ 02-challenges      挑战与任务（目标 / 步骤 / 交付物 / 评分 / 常见错误）
├─ 03-prompts         可复用提示词
├─ 04-faq             常见问题（学生 / 教师 / Builder）
├─ 05-best-practices  最佳实践
├─ 06-projects        项目案例与复盘
├─ 07-agents          Agent 上下文与 Knowledge Librarian
└─ (未来) Rubric / Concept / Skill  评价标准与概念技能节点
```

### 核心数据模型（KnowledgeItem）

每一条知识都是一个结构化实体，不是一篇普通文档：

| 字段类别 | 字段 | 作用 |
|---|---|---|
| 标识 | id, title, type, status | 稳定 ID + 类型 + 状态（draft/review/stable/deprecated） |
| 检索 | keywords, tags, concepts, skills, audience | metadata-first 搜索核心 |
| 关系 | related, relationships | 显式表达条目间关系（includes / requires / supports / usesPrompt / assessedBy / relatedTo） |
| 知识增长 | situation, ontology, workflow, skill, evaluation, knowledgeGrowth | 串联"场景→本体→流程→技能→评估→学习→知识增长"闭环 |
| Agent 就绪 | agentNotes | 告诉 Agent 何时检索、能回答什么问题、需要什么关联上下文、有什么限制 |
| 审计 | createdAt, updatedAt, createdBy, updatedBy | 版本与贡献追踪 |

---

## 二、给谁用的（目标用户）

| 角色 | 核心需求 | 在产品里做什么 |
|---|---|---|
| **学习者** | 查找课程说明、挑战任务、提示词模板、FAQ、项目案例 | 在 Demo App 里按分类筛选 + 关键词搜索，找到可直接复用的知识 |
| **教师 / 课程组织者** | 维护课程知识，沉淀常见问题、优秀案例和教学经验 | 用模板创建知识条目 → 填 metadata → 提交 GitHub → Review 后发布为 stable |
| **Builder / 项目成员** | 按标准模板提交新知识条目，通过协作流程完成评审 | 选知识类型 → 填标题/摘要/关键词/概念/技能/关系/正文 → 校验 metadata → review → Merge 发布 |
| **Agent** | 根据问题、角色、课程、任务和上下文检索可用知识 | 调用 Knowledge Repository API → 按 metadata + relationships 检索 → 生成带引用的回答 |
| **后端 / 平台开发者** | 按统一模型实现数据库、API、搜索、关系和 Agent 接口 | 按 KnowledgeItem 模型建表 → 实现 metadata-first 搜索 → 预留 Agent 检索 API |

### 用户体验原则

本产品当前优先服务两类人：一类是需要快速查找和复用知识的学习者 / 教师，另一类是需要持续沉淀资料的 Builder。围绕这两类用户，体验设计遵守以下原则：

| 原则 | 具体含义 | 当前 MVP 的落地 |
|---|---|---|
| **少理解系统，多完成动作** | 用户不需要先理解 schema 和字段体系，也能上传、搜索、查看和复用知识 | 上传区使用“三步流程”：上传资料 → 生成草稿 → 检查发布 |
| **先给结果，再给解释** | 系统先给出草稿、分类和搜索结果，再展示命中的 metadata、关系和来源 | 搜索优先匹配 keywords / title / type，详情页展示 metadata 与关系 |
| **让用户知道下一步** | 每个关键状态都提示下一步该做什么，而不是让用户停在结果页 | 草稿生成后引导补 metadata；详情页提供“开始带练”和关系入口 |
| **从看资料变成被带着学** | 浏览模块的目标不是让用户翻文档，而是帮助用户快速掌握和复用 | “老师带练”根据知识类型和关系生成学习路径 |
| **关系可视化但不炫技** | 图谱不是装饰，而是帮助用户理解项目、挑战、交付物、技能和最佳实践的关系 | 知识图谱基于显式 relationships 和项目结构节点生成 |

---

## 三、解决什么问题

| # | 痛点 | 现状 | 解决方案 |
|---|---|---|---|
| 1 | **资料分散** | 课程说明、挑战任务、提示词、FAQ、项目案例分布在不同位置 | 统一 Knowledge Repository，10 个分类目录，所有知识归一 |
| 2 | **复用困难** | 好的提示词、案例和经验很难被后续学习者、教师、Builder 或 Agent 找到 | metadata-first 搜索 + 稳定 ID + 关键词/标签/概念/技能多维检索 |
| 3 | **结构不足** | 普通文档适合阅读，但不适合筛选、搜索、关联和系统调用 | KnowledgeItem 数据模型 + JSON Schema 校验 + 模板标准化 |
| 4 | **关系缺失** | 课程、挑战、技能、概念、提示词、项目之间的关系没有被显式表达 | Relationship 表（source→predicate→target），6 种标准关系谓词，显式字段 |
| 5 | **难以增长** | 项目产出如果没有沉淀机制，很难变成后续可复用知识 | 知识增长闭环：场景→本体→流程→技能→评估→学习→知识增长 + KSTAR 更新流程 |
| 6 | **Agent 难调用** | 没有稳定 ID、metadata 和关系结构，Agent 很难可靠检索上下文 | agentNotes 字段 + audience/type/status/related 显式化 + 未来 API 检索接口 |

**一句话**：解决"AI 教育项目中的知识无法被结构化存储、精准检索、显式关联、持续增长和被 Agent 可靠调用"的问题。

---

## 四、产品价值

### 对 NSEAP 生态的价值

| 服务对象 | 提供的价值 |
|---|---|
| **Curriculum Team（课程组）** | 把 weekly plan、learning objectives、lecture notes 转成可复用课程知识条目 |
| **Challenge Team（挑战组）** | 把 Challenge 转成结构化条目，含目标、步骤、交付物、评分方式、常见错误、相关提示词和知识增长 |
| **Agent Team（Agent 组）** | 提供结构化上下文、提示词样例、FAQ 和 metadata，让 Agent 更干净地检索知识 |
| **Ontology Team（本体组）** | 提供 concepts、skills、relationships，作为未来 ontology node/edge 的输入 |
| **Platform Team（平台组）** | 提供干净的 Markdown 内容源和静态 Demo，未来可接 GitHub Pages、文档门户、LMS、API |
| **Demo Team（演示组）** | 提供清楚的展示故事：项目知识不再散落，而是结构化、可检索、可复用、可被 Agent 使用的知识资产 |

### 核心产品价值

| 价值点 | 说明 |
|---|---|
| **不是文件夹，是认知细胞** | 有 Identity（知识认知细胞 / Knowledge Team / 未来 Knowledge Librarian Agent）、Capability（知识组织/模板标准化/提示词管理/...）、Interface（Demo App / Markdown / YAML / JSON Schema / GitHub PR / 未来 API+MCP） |
| **metadata-first 搜索** | 搜"挑战"优先返回 `type=challenge` 或 `keywords=挑战` 的条目，而不是正文随机出现"挑战"的文档 |
| **Agent-ready 设计** | 当前不实现向量数据库，但通过 agentNotes + 显式 metadata + 关系结构，为未来 Agent 检索铺好地基 |
| **可演化路径清晰** | L0→L5 六级成熟度模型 + V0.2→V1.0 阶段路线 |
| **对齐 IEEE 标准体系** | P2807.8（知识图谱/教育本体）、P3394（Agent Interface/Manifest）、P3428（能力等级/评估）、CognitiveCell（总架构语言）、Tech-discussions（OKF + FDE Workbench 路线） |

### 版本路线

| 版本 | 内容 | 目标 |
|---|---|---|
| V0.1（已完成） | 静态 Demo + Markdown + JSON + 搜索索引 + 模板 + Schema + 设计文档 | 验证产品模型、知识结构和演示流程 |
| **V0.2（当前）** | 轻量前后端 + 本地 JSON 数据库 + 文件上传 + LLM 配置入口 + metadata 编辑 + 关系管理 + 图谱 + 老师带练 | 验证真实资料从上传到沉淀、检索、关联、复用的闭环 |
| V0.3 | KnowledgeItem API + 数据库 + 搜索服务 + Markdown 导入导出 + 关系管理 | 从静态 MVP 升级为可维护服务 |
| V1.0 | 正式后端 + 工作台前端 + 审核流程 + Prompt Studio + Agent 检索接口 + FDE Workbench 集成 | 成为 NSEAP 的正式知识仓库能力 |

---

## 五、如何使用 — 快速上手

### 方式一：跑起来看轻量前后端 MVP（推荐，2 分钟）

```bash
# 1. 进入项目目录
cd nseap-knowledge-base

# 2. 启动服务
npm run dev

# 3. 打开浏览器
#    http://127.0.0.1:8787/index.html
```

Demo 功能：
- 浏览知识条目列表
- 按 Course / Challenge / Prompt / Project / Agent 分类筛选
- 搜索标题、关键词、标签、概念、技能、适用对象和正文内容
- 上传资料并自动生成 draft 知识草稿
- 配置 LLM 模型信息，为后续自动分类做准备
- 编辑草稿 metadata，例如关键词、概念、技能、适用对象和状态
- 维护显式关系，例如项目包含挑战、项目使用最佳实践
- 切换知识图谱，查看项目、挑战、交付物、技能和最佳实践之间的关系
- 悬浮预览搜索结果，不进入详情也能快速判断是否相关
- 点击“开始带练”，按老师式路径理解和复用一条知识
- 查看条目的 metadata、concepts、skills、relationships
- 展示知识增长流程：场景→本体→流程→技能→评估→学习→知识增长

### 方式二：静态 Demo 备用入口

如果只是查看前端演示，也可以用静态方式打开：

```bash
cd nseap-knowledge-base/app
python -m http.server 8000
# 打开 http://localhost:8000
```

### 方式三：作为 Builder 贡献知识条目（开发者）

```
Step 1  选知识类型 → 找到对应目录（如 knowledge-base/02-challenges/）
Step 2  复制模板  → templates/knowledge-item-template.md
Step 3  填写内容  → 标题、摘要、keywords、tags、concepts、skills、
                   related、relationships、situation→knowledgeGrowth、agentNotes
Step 4  校验      → 对照 schemas/knowledge-item.schema.json 确认 metadata 合规
Step 5  重新索引  → node scripts/build-search-index.js
Step 6  提交      → GitHub PR → Peer Review → Agent Review → Merge → Release
```

### 方式四：作为后端开发者接续开发（平台组）

后端基线已在 DESIGN.md 第 9 节定义：

| 层面 | 设计 |
|---|---|
| **数据库** | knowledge_items + 5 张多值子表（audiences/tags/keywords/concepts/skills）+ knowledge_relationships + knowledge_revisions |
| **API** | GET/POST/PATCH/DELETE /api/knowledge-items + 关系接口 + 搜索建议 + Markdown 导入导出 |
| **搜索** | metadata-first：keywords > title > tags > concepts > skills > type > audience > headings > summary > content |
| **同步** | V0.1 Markdown 为源 → V0.3 双向同步 → V1.0 数据库为主、Markdown 作为导出/审计格式 |

MVP 与后端对应关系：

| 当前 MVP | 正式后端 |
|---|---|
| `data/knowledge-db.json` | `knowledge_items` + metadata 子表 |
| `POST /api/upload` | 原始文件存储 + 正文抽取 + 自动生成草稿 |
| `GET /api/knowledge` | `GET /api/knowledge-items` |
| `PATCH /api/knowledge/:id` | 知识条目编辑、metadata 更新、状态流转 |
| `DELETE /api/knowledge/:id` | 归档 / 回收站机制 |
| 分类按钮 | `type` 查询参数 |
| 搜索框 | `/api/knowledge-items?q=...` 或独立搜索服务 |
| `POST /api/knowledge/:id/relationships` | `knowledge_relationships` |
| `GET /api/knowledge-graph` | 图谱节点 / 边 API |
| `GET /api/guided-path?entryId=...` | 老师带练 / 学习路径服务 |
| LLM 设置入口 | 模型配置、Key 管理、LLM 自动分类服务 |

### 当前 v0.2 已验证的体验闭环

| 用户动作 | 系统反馈 | 验证意义 |
|---|---|---|
| 上传真实资料 | 抽取正文并生成 draft 草稿 | 证明资料不是写死在页面里，而是能进入后端数据库 |
| 搜索“挑战 / 大数据 / C2S”等词 | 优先按 metadata 命中相关条目 | 验证 metadata-first 搜索比普通全文搜索更精准 |
| 打开 C2S 项目案例 | 看到摘要、关键词、概念、技能、关系和知识增长流程 | 证明项目资料可以被结构化复盘 |
| 查看知识图谱 | 看到项目与挑战、交付物、概念、技能、最佳实践之间的关系 | 证明关系不是只写在正文里，而是可视化、可接口化 |
| 点击“开始带练” | 生成老师式学习路径 | 证明浏览模块可以从“自己看资料”升级为“被带着理解和复用” |
| 归档条目 | 默认从浏览和搜索中隐藏，但数据仍保留 | 证明已经考虑知识生命周期，而不是简单删除 |

### 下一步体验优化

| 优化方向 | 为什么重要 | 下一步做法 |
|---|---|---|
| 上传后的解释更清楚 | 用户需要知道系统为什么这样分类，以及还缺什么 | 在草稿页显示“分类理由、命中关键词、缺失 metadata、下一步建议” |
| LLM 分类真正接入 | 当前没有 Key 时只能规则兜底，分类能力有限 | 配置 API Key 后，让 LLM 生成类型、摘要、关键词、概念、技能和适用对象 |
| 图谱更像 Obsidian / 飞书 | 用户需要快速看懂知识之间的关系 | 使用成熟 force-graph 力导向图，支持拖拽、缩放、悬浮预览和点击打开 |
| 搜索结果悬浮预览 | 用户不想每条都点进去看 | 在搜索结果和图谱节点中提供轻量预览卡片 |
| 老师带练更贴内容 | 当前是规则模板，讲解还不够个性化 | 后续由 LLM 根据当前条目和关联知识生成 teacherScript 和 checkQuestion |
| 审核发布流程 | 真实知识库不能所有草稿直接稳定发布 | 增加 draft → review → stable → archived 的操作提示、负责人和检查项 |
| Agent Notes 编辑 | 未来 Agent 需要知道每条知识能回答什么、不能回答什么 | 在详情页补充 Agent 使用说明编辑区，供后端和 Agent 检索直接读取 |

---

## 六、竞品分析

### 竞品全景对比

| 维度 | 通用文档/Wiki (Confluence/Notion) | 个人知识管理 (Obsidian/Logseq) | AI 知识库/RAG (LangChain/Dify) | **Knowledge Cognitive Cell** |
|---|---|---|---|---|
| 定位 | 团队协作文档库 | 个人笔记网络 | AI 应用的知识检索层 | 教育知识认知细胞 |
| 结构化 metadata | 弱（自由格式） | 中（frontmatter） | 中（chunk+embedding） | **强（KnowledgeItem 模型 + Schema）** |
| 知识关系 | 无/弱（链接） | 中（双链） | 弱（向量相似度） | **强（显式 Relationship + 6 种谓词）** |
| 搜索方式 | 全文搜索 | 全文+链接 | 向量语义搜索 | **metadata-first + 全文辅助** |
| Agent 就绪 | ✗ | ✗ | ✓（但知识无结构） | **✓（agentNotes + 显式 metadata）** |
| 教育领域建模 | ✗ | ✗ | ✗ | **✓（course/challenge/prompt/FAQ 类型）** |
| 知识增长闭环 | ✗ | ✗ | ✗ | **✓（场景→本体→...→知识增长）** |
| 演化路径 | 无 | 插件扩展 | 无明确成熟度模型 | **L0-L5 六级 + V0.2-V1.0 路线** |
| 标准对齐 | 无 | 无 | 无 | **IEEE P2807.8/P3394/P3428 + CognitiveCell** |
| 部署方式 | SaaS/自部署 | 本地 | 框架（自己搭） | **开源 + 轻量前后端 MVP → 正式后端 → FDE Workbench** |

### 竞品逐一分析

#### 1. 团队文档/Wiki（Confluence / Notion / GitHub Wiki）

| 维度 | Confluence/Notion | Knowledge Cognitive Cell |
|---|---|---|
| 定位 | 通用团队协作文档库 | 教育知识认知细胞 |
| 知识结构 | 自由格式页面，无强制 metadata | KnowledgeItem 模型 + JSON Schema 强制校验 |
| 搜索 | 全文搜索——搜"挑战"返回所有正文提到"挑战"的页面 | metadata-first——搜"挑战"优先返回 `type=challenge` 的条目 |
| 关系 | 页面间链接，无语义关系 | 显式 Relationship 表，6 种谓词 |
| Agent 就绪 | ✗ Agent 无法可靠解析自由格式 | ✓ agentNotes + 显式 type/audience/status/related |
| 相同点 | 都支持分类目录、协作、Review 流程 | |
| **关键差异** | Confluence 是"给人看的文档库"；本产品是"给人+Agent 共用的结构化知识仓库" | |

#### 2. 个人知识管理（Obsidian / Logseq / Roam Research）

| 维度 | Obsidian/Logseq | Knowledge Cognitive Cell |
|---|---|---|
| 定位 | 个人双链笔记网络 | 组织级教育知识仓库 |
| 关系 | 双链（backlink）——隐式关联 | 显式关系表——predicate 有语义 |
| metadata | frontmatter 可选，无强制 schema | KnowledgeItem JSON Schema 强制 + 模板 |
| 搜索 | 全文 + 标签 | metadata-first 多维检索 |
| 协作 | 个人为主，Git 同步为辅 | GitHub PR + Peer Review + Agent Review |
| 教育建模 | ✗ 无 course/challenge/prompt 类型 | ✓ 原生支持教育知识类型 |
| 演化 | 插件生态，无成熟度模型 | L0-L5 认知细胞演化路径 |
| 相同点 | 都用 Markdown + frontmatter + 文件目录 | |
| **关键差异** | Obsidian 做个人笔记网络；本产品做组织级、Agent-ready、教育领域的知识基础设施 | |

#### 3. AI 知识库 / RAG 框架（LangChain / LlamaIndex / Dify Knowledge Base）

| 维度 | LangChain/Dify KB | Knowledge Cognitive Cell |
|---|---|---|
| 定位 | AI 应用的知识检索层（给 LLM 喂上下文） | 教育知识认知细胞（给人+Agent+平台共用） |
| 知识结构 | 文档切块→向量化→语义检索，知识本身无类型/关系 | KnowledgeItem 结构化实体 + 显式关系 + 知识增长闭环 |
| 搜索 | 向量语义搜索（语义相似） | metadata-first 搜索（意图精准匹配）——两者可互补 |
| Agent 就绪 | ✓ 但知识是无结构的 chunk | ✓ 且知识是有结构的条目（agentNotes） |
| 教育领域 | ✗ 通用 | ✓ course/challenge/prompt/FAQ/best-practice/project 原生类型 |
| 知识增长 | ✗ 无闭环机制 | ✓ 场景→本体→流程→技能→评估→学习→知识增长 + KSTAR |
| 部署 | 框架（开发者自己搭） | 开源产品（轻量前后端 MVP → 正式后端 → FDE Workbench） |
| 相同点 | 都面向 Agent 检索设计 | |
| **关键差异** | RAG 框架解决"Agent 怎么检索"；本产品解决"知识本身怎么被结构化组织、持续增长、演化成认知细胞"——在 RAG 的上游 | |

#### 4. 学习内容管理系统（LCMS / 传统教育内容管理平台）

| 维度 | 传统 LCMS | Knowledge Cognitive Cell |
|---|---|---|
| 定位 | 教育内容管理（管课件、题库） | 教育知识认知细胞（管知识条目+关系+Agent 上下文） |
| 内容粒度 | 课件/课程级别 | 知识条目级别（可细到一条 Prompt、一条 FAQ） |
| 关系 | 课程树（包含关系） | 知识图谱（6 种语义关系） |
| Agent | ✗ | ✓ agentNotes + 检索接口 |
| 标准 | SCORM 等传统教育标准 | IEEE P2807.8/P3394/P3428 + Cognitive Cell |
| 相同点 | 都面向教育场景、都管教学内容 | |
| **关键差异** | LCMS 管的是"内容分发"；本产品管的是"知识沉淀、关联、增长和 Agent 就绪" | |

---

## 七、总结

> **NSEAP 知识认知细胞不是文件夹，不是文档库，而是一个有 Identity / Capability / Interface 的结构化知识仓库。它用 KnowledgeItem 模型 + metadata-first 搜索 + 显式关系 + 知识增长闭环 + agentNotes，把课程、挑战、提示词、FAQ、最佳实践和项目案例沉淀为可检索、可复用、可被 Agent 调用、未来可图谱化和可自我进化的认知资产。当前 v0.2 是 L2 标准化知识库的轻量前后端 MVP，已经验证真实资料上传、草稿生成、metadata 编辑、关系管理、知识图谱和老师带练的体验闭环，下一步目标是演化到 L3 Agent-Ready，并最终走向 L5 Knowledge Librarian Agent。**

---

### 附录：参考文件

| 文件 | 对设计的影响 |
|---|---|
| `Elite20-Vibe-Coding-Course.docx` | 明确 Builder Program 的协作、GitHub 提交、评审、文档化和发布流程 |
| `CognitiveCell.docx` | 将知识库设计为有身份、能力、接口和演化路径的认知细胞 |
| `[Clean]P2807.8...docx` | 为教育知识图谱、学习路径、本体和语义关系预留结构 |
| `P3394-D1.0.0-IEEE-Draft` | 为未来 Agent 接口、manifest、消息和互操作能力预留方向 |
| `3428 draft.docx` | 用能力等级和评估维度衡量模块成熟度 |
| `Tech-discussions.docx` | 对齐 FDE、OKF、Knowledge Repository、Prompt Studio、KSTAR 和 FDE Workbench 路线 |
