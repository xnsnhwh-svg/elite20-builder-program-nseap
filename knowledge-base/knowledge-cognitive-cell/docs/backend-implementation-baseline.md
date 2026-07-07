# 后端实现设计基线

本文档用于约束后续后端实现，确保后端不是重新发明一套系统，而是承接当前 Knowledge Cognitive Cell MVP 的设计。

当前 MVP 使用静态前端、Markdown、JSON 和搜索索引验证产品逻辑。后续后端实现时，应保持同一套核心模型：知识条目是基本节点，metadata 是检索和关联的基础，关系字段用于未来知识图谱和 Agent 调用。

## 1. 后端目标

后端第一阶段不需要做复杂平台，目标是把当前静态 MVP 升级为可维护、可检索、可协作的知识服务。

后端应提供：

- 知识条目的增删改查。
- 分类、关键词、标签、概念、技能等结构化检索。
- Markdown 内容和 metadata 的统一存储。
- 搜索索引生成或更新。
- 条目关系维护。
- 基础审核状态。
- 为未来 Agent 检索提供稳定接口。

后端不应一开始就做：

- 完整知识图谱推理。
- 复杂权限系统。
- 自动评分系统。
- 完整 Agent 编排系统。
- 完整 FDE Workbench。

## 2. 核心实体

### 2.1 KnowledgeItem

知识条目是系统核心实体。

推荐字段：

```text
id                  稳定唯一 ID，例如 kb-challenge-001
title               标题
type                类型：course / challenge / prompt / faq / best-practice / project / agent / overview
status              状态：draft / review / stable / deprecated
summary             摘要
content             Markdown 正文
source              原始文件路径或内容来源
audience            适用对象
tags                标签
keywords            搜索关键词，包含同义词和常用说法
concepts            概念
skills              技能
related             相关条目 ID
relationships       显式关系
situation           场景
ontology            本体说明
workflow            使用流程
skill               技能说明
evaluation          评估方式
knowledgeGrowth     知识增长说明
createdAt           创建时间
updatedAt           更新时间
createdBy           创建者
updatedBy           更新者
```

### 2.2 Relationship

关系用于表达知识条目之间、条目与概念之间的连接。

推荐字段：

```text
id
sourceId
predicate
targetId
targetLabel
confidence
note
createdAt
```

常用关系：

```text
includes      包含
requires      需要
supports      支持
usesPrompt    使用提示词
relatedTo     相关
assessedBy    被某评价标准评估
```

### 2.3 SearchIndex

搜索索引不应只搜正文，而应优先搜结构化字段。

推荐索引字段：

```text
itemId
title
type
audience
tags
keywords
concepts
skills
headings
summary
contentPreview
updatedAt
```

默认搜索优先级：

```text
keywords > title > tags > concepts > skills > type > audience > headings > summary > content
```

说明：

- `keywords` 用来承接用户自然搜索词，例如“挑战”“任务”“AI 助手”。
- `tags` 更偏分类和主题。
- `concepts` 更偏知识图谱节点。
- `skills` 更偏能力节点。
- 正文全文搜索可以作为扩展能力，但不应该默认压过关键词和 metadata。

## 3. 数据库设计建议

第一版可以用关系型数据库实现，避免过早上复杂图数据库。

建议表：

```text
knowledge_items
knowledge_item_audiences
knowledge_item_tags
knowledge_item_keywords
knowledge_item_concepts
knowledge_item_skills
knowledge_relationships
knowledge_revisions
```

### 3.1 knowledge_items

```text
id                  primary key
title
type
status
summary
content_markdown
source
situation
ontology
workflow
skill
evaluation
knowledge_growth
created_at
updated_at
created_by
updated_by
```

### 3.2 metadata 子表

为避免一个字段里塞长字符串，建议把多值字段拆成子表：

```text
knowledge_item_keywords(item_id, value)
knowledge_item_tags(item_id, value)
knowledge_item_concepts(item_id, value)
knowledge_item_skills(item_id, value)
knowledge_item_audiences(item_id, value)
```

这样后续做筛选、统计、推荐和 Agent 检索会更稳定。

### 3.3 knowledge_relationships

```text
id
source_item_id
predicate
target_item_id
target_label
note
created_at
```

如果 `target_item_id` 存在，说明关系指向另一个知识条目。  
如果只存在 `target_label`，说明关系先指向一个概念或外部对象，未来可以再实体化。

## 4. API 设计草案

### 4.1 查询知识条目

```text
GET /api/knowledge-items
```

参数：

```text
q             搜索词
type          类型
status        状态
tag           标签
keyword       关键词
concept       概念
skill         技能
audience      适用对象
limit
offset
```

返回：

```json
{
  "items": [
    {
      "id": "kb-challenge-001",
      "title": "构建你的第一个 AI Assistant",
      "type": "challenge",
      "status": "sample",
      "summary": "第一个 PBL 挑战...",
      "tags": ["challenge", "ai-assistant"],
      "keywords": ["挑战", "任务", "AI 助手"],
      "concepts": ["AI Assistant", "提示词工程"],
      "skills": ["定义 Agent 角色", "编写指令提示词"]
    }
  ],
  "total": 1
}
```

### 4.2 查询单个条目

```text
GET /api/knowledge-items/{id}
```

返回完整条目，包括正文、metadata、关系和知识增长字段。

### 4.3 创建条目

```text
POST /api/knowledge-items
```

请求体应与 KnowledgeItem 模型一致。

后端需要校验：

- `id` 是否唯一。
- `type` 是否合法。
- `title` 是否存在。
- `keywords/tags/concepts/skills` 是否为数组。
- `relationships` 是否符合 predicate 规则。

### 4.4 更新条目

```text
PATCH /api/knowledge-items/{id}
```

更新后应重新生成或刷新搜索索引。

### 4.5 查询关系

```text
GET /api/knowledge-items/{id}/relationships
```

用于展示“这个知识条目支持谁、依赖谁、使用了什么提示词”。

### 4.6 搜索建议

```text
GET /api/search/suggestions?q=助
```

返回可能的关键词、标签、概念和技能，用于后续前端搜索体验。

## 5. 搜索策略

后端搜索必须继承当前 MVP 的原则：用户搜索优先匹配文件自身的关键词和 metadata。

默认搜索流程：

```text
用户输入
-> 标准化搜索词
-> 匹配 keywords
-> 匹配 title
-> 匹配 tags / concepts / skills
-> 匹配 type / audience
-> 必要时再匹配 summary / content
-> 返回结果并标注匹配原因
```

推荐返回 `matchedFields`，让前端知道为什么命中：

```json
{
  "id": "kb-challenge-001",
  "title": "构建你的第一个 AI Assistant",
  "matchedFields": ["keywords", "type"]
}
```

这样可以避免用户搜“挑战”时，因为课程正文里出现“挑战”而错误排在前面。

## 6. Markdown 与数据库同步

后端实现有两种路线。

### 路线 A：Markdown 为源

```text
Markdown 文件
-> 解析 frontmatter
-> 写入数据库
-> 生成搜索索引
-> 前端/API 查询
```

优点：

- 保持 GitHub 协作友好。
- 适合课程项目和 review。
- 所有修改有版本历史。

缺点：

- 在线编辑体验较弱。
- 需要同步脚本。

### 路线 B：数据库为源

```text
前端表单
-> API
-> 数据库
-> 导出 Markdown
-> GitHub 归档
```

优点：

- 更像正式产品。
- 支持在线编辑、审核和权限。

缺点：

- 开发成本更高。
- 需要处理导出和版本记录。

建议：

```text
V0.1-V0.2：Markdown 为源
V0.3：Markdown + 数据库双向同步
V1.0：数据库为主，Markdown 作为导出和审计格式
```

## 7. 与当前 MVP 的对应关系

| 当前 MVP | 后端版本 |
| --- | --- |
| `knowledge-base/*.md` | `knowledge_items.content_markdown` + metadata 表 |
| `app/knowledge-data.json` | `GET /api/knowledge-items` |
| `app/search-index.json` | 搜索索引表或搜索服务 |
| 分类按钮 | `type` 查询参数 |
| 搜索框 | `/api/knowledge-items?q=...` |
| 详情面板 | `GET /api/knowledge-items/{id}` |
| 关系展示 | `knowledge_relationships` |
| 知识卡片模拟 | `POST /api/knowledge-items` |

## 8. 后端验收标准

后端第一版完成时，应满足：

1. 可以创建一个知识条目。
2. 可以按类型筛选。
3. 可以按关键词搜索。
4. 可以查看条目详情。
5. 可以维护 tags、keywords、concepts、skills。
6. 可以维护条目关系。
7. 搜索“挑战”时，优先返回带有 `keywords: 挑战` 或 `type: challenge` 的条目。
8. 可以导入当前 Markdown 知识文件。
9. 可以导出为 Markdown 或 JSON，便于 GitHub review。
10. API 返回结构与当前 MVP 数据模型兼容。

## 9. 设计原则

后端实现时应遵守以下原则：

- 不把知识当普通文章，而是当结构化知识节点。
- 不把搜索做成纯全文搜索，而是 metadata-first search。
- 不把关系藏在正文里，而是用显式 relationship 表达。
- 不把第一版做得过重，优先保证模型正确。
- 不破坏 GitHub review 和文档化流程。
- 保持未来接入 Agent、知识图谱和 FDE Workbench 的可能性。

## 10. 当前结论

后端应从当前 MVP 自然升级，而不是重做一套系统。

最小后端版本可以定义为：

```text
Knowledge Repository API
= KnowledgeItem CRUD
+ Metadata Search
+ Relationship Management
+ Markdown Import/Export
+ Agent-ready Data Model
```

这就是后续后端设计和开发的基线。
