# NSEAP 知识条目规范

版本：v0.1 Draft  
适用范围：Knowledge Team 当前 MVP、后续真实内容沉淀、后端数据建模、GitHub 提交流程  
文档目的：先统一“什么算一条合格的知识”，再继续补内容、做搜索、接后端

## 1. 这份规范解决什么问题

当前第 6 组做的不是普通资料整理，而是把课程、挑战、提示词、FAQ、最佳实践、项目案例、Agent 上下文沉淀为可复用知识条目。

如果没有统一规范，后续会出现四个问题：

1. 新内容不知道该放哪个目录。
2. 搜索结果不稳定，搜“挑战”却先出来课程说明。
3. 后端接数据时字段不统一，前后端各做一套。
4. 后续如果接 Agent，没有稳定的类型、关键词和关系结构可用。

所以这份文档先定义：一条知识最少要长什么样、按什么规则分类、哪些字段必须有、哪些字段决定搜索效果、哪些字段为后端和 Agent 预留。

## 2. 设计原则

### 2.1 按用途分类，不按文件形式分类

分类依据不是“它是不是 Markdown、PPT、Word”，而是“它主要解决什么问题、给谁用、在系统里扮演什么角色”。

### 2.2 先做 metadata-first，再做全文搜索

搜索时优先看关键词、标题、类型、标签、概念、技能，而不是先扫正文。这样用户搜“挑战”时，会先拿到真正的挑战条目，而不是正文里刚好提到“挑战”的其他文档。

### 2.3 条目是知识节点，不是普通文章

每条知识都应有稳定 ID、明确类型、适用对象、摘要、关键词和关系。正文只是条目的一部分，不是全部。

### 2.4 MVP 和正式产品分层设计

当前 MVP 可以先以 Markdown 和静态演示为主，但字段命名、分类方式和搜索规则必须能平滑映射到数据库和 API。

### 2.5 用户展示用中文，底层枚举保持稳定

页面和文档展示使用中文；底层 `type`、`status`、`audience`、`predicate` 建议使用稳定英文枚举，方便后续前后端统一。

## 3. 知识条目的分类规则

当前统一采用以下 8 类：

| 类型 | 枚举值 | 适用内容 | 存放目录 |
| --- | --- | --- | --- |
| 概览 | `overview` | 系统说明、模块定位、总览、使用介绍 | `knowledge-base/00-overview/` |
| 课程 | `course` | 周计划、学习目标、课程说明、教师引导 | `knowledge-base/01-course/` |
| 挑战 | `challenge` | 任务目标、步骤、交付物、评分、常见错误 | `knowledge-base/02-challenges/` |
| 提示词 | `prompt` | 可复用提示词模板、输入要求、输出预期 | `knowledge-base/03-prompts/` |
| FAQ | `faq` | 常见问题与回答 | `knowledge-base/04-faq/` |
| 最佳实践 | `best-practice` | 可复用方法、标准、工作原则 | `knowledge-base/05-best-practices/` |
| 项目案例 | `project` | 项目示例、案例拆解、复盘、可借鉴成果 | `knowledge-base/06-projects/` |
| Agent 上下文 | `agent` | Agent 角色、调用说明、上下文需求、限制说明 | `knowledge-base/07-agents/` |

### 3.1 快速判断一条内容属于哪一类

按下面顺序判断：

1. 如果它主要是在解释“这个系统 / 模块是什么”，归 `overview`。
2. 如果它核心是教学安排、学习路径、课程内容，归 `course`。
3. 如果它要求用户完成一个任务，并带有交付要求或评分，归 `challenge`。
4. 如果它最核心的资产是一段可复用提示词，归 `prompt`。
5. 如果它主要是问答形式，归 `faq`。
6. 如果它是在总结一套反复可复用的方法，归 `best-practice`。
7. 如果它展示的是完整成果、案例、复盘，归 `project`。
8. 如果它主要服务未来 Agent 的角色说明、上下文或调用方式，归 `agent`。

## 4. 一条知识的字段标准

### 4.1 三层字段体系

为了兼顾当前 MVP 和后端落地，字段分三层：

| 层级 | 目标 | 说明 |
| --- | --- | --- |
| L1 最小必填 | 先让条目能入库、能被搜到 | 当前最先执行 |
| L2 标准字段 | 让条目更清晰、更好复用 | 推荐随内容沉淀补齐 |
| L3 Agent/后端字段 | 为关系、接口、检索解释做准备 | 审批后逐步接入 |

### 4.2 L1 最小必填字段

以下字段建议作为当前阶段的最低门槛：

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 稳定唯一 ID，例如 `kb-challenge-001` |
| `title` | 是 | 标题，能让人直接看懂是什么 |
| `type` | 是 | 条目类型，必须使用统一枚举 |
| `summary` | 是 | 一句话说明“解决什么问题，谁会用到” |
| `audience` | 是 | 适用对象，至少 1 个 |
| `keywords` | 是 | 搜索核心字段，至少 3 个 |
| `status` | 是 | 当前状态 |
| `source` | 是 | 原始来源或源文件路径 |

### 4.3 L2 标准字段

这些字段不是当前每条都必须一次补齐，但正式进入稳定知识库时建议具备：

| 字段 | 说明 |
| --- | --- |
| `tags` | 主题标签，便于筛选和聚类 |
| `concepts` | 该条目涉及的核心概念 |
| `skills` | 该条目对应的核心能力或动作 |
| `relationships` | 与其他知识条目的显式关系 |
| `related` | 相关条目 ID 列表，便于快速跳转 |
| `situation` | 使用场景 |
| `workflow` | 使用流程或操作步骤 |
| `evaluation` | 如何判断这条知识用得好不好 |
| `knowledgeGrowth` | 这条知识后续如何增长、沉淀到别处 |

### 4.4 L3 Agent / 后端字段

这些字段主要为后续系统化建设预留：

| 字段 | 说明 |
| --- | --- |
| `agentNotes` | 告诉 Agent 何时取这条知识、适合回答什么问题 |
| `ontology` | 更偏概念结构或本体映射说明 |
| `createdAt` / `updatedAt` | 后端时间字段 |
| `createdBy` / `updatedBy` | 审计字段 |
| `content` | Markdown 正文 |

## 5. 字段填写规则

### 5.1 ID 规则

统一格式：

```text
kb-{type}-{number}
```

示例：

```text
kb-course-001
kb-challenge-001
kb-prompt-003
```

要求：

1. `type` 必须与条目实际类型一致。
2. 编号部分使用三位数字，便于后续扩展。
3. ID 一旦发布，不建议随意改动。

### 5.2 标题规则

标题要让老师或组员扫一眼就知道内容，不要只写模糊名词。

推荐：

- `Week 1 课程导览`
- `构建你的第一个 AI 助手`
- `Builder 提交 FAQ`

不推荐：

- `说明`
- `学习资料`
- `第一周`

### 5.3 audience 规则

底层建议统一枚举：

```text
student
teacher
builder
agent
```

页面展示可映射成：

```text
student -> 学生
teacher -> 教师
builder -> Builder
agent   -> Agent
```

填写建议：

1. 至少 1 个，最多建议 3 个。
2. 不要为了“显得通用”把每条都写成全部角色。
3. 谁最常用它，就优先写谁。

### 5.4 status 规则

统一枚举：

| 状态 | 枚举值 | 说明 |
| --- | --- | --- |
| 草稿 | `draft` | 刚创建，结构还不完整 |
| 待评审 | `review` | 内容已成型，等待审阅 |
| 稳定 | `stable` | 可以对外复用 |
| 样例 | `sample` | 用于演示结构的示例条目 |
| 废弃 | `deprecated` | 已不建议继续使用 |

当前建议：

- 真实新增内容默认从 `draft` 开始。
- 课堂演示样例可以保留为 `sample`。
- 经过审阅可进入 `review` 或 `stable`。

### 5.5 keywords 规则

`keywords` 是搜索质量最关键的字段。

建议每条填写 3 到 8 个关键词，并覆盖以下几类：

1. 用户自然会搜的词。
2. 条目类型词。
3. 场景词。
4. 核心对象词。
5. 必要时补一个英文别名。

示例：

```text
挑战, 任务, AI 助手, Challenge, 交付物
```

不推荐做法：

- 只写很空的词，比如“学习”“知识”“内容”。
- 完全复制标签，不考虑真实搜索习惯。
- 关键词堆太多，失去重点。

### 5.6 tags / concepts / skills 的边界

为了避免这三个字段混成一团，统一这样理解：

| 字段 | 主要用途 | 示例 |
| --- | --- | --- |
| `tags` | 主题归类、便于筛选 | `Week 1`、`ai-assistant` |
| `concepts` | 这条知识涉及的概念 | `提示词工程`、`角色定义` |
| `skills` | 使用这条知识需要或训练的能力 | `编写系统提示`、`评估输出质量` |

简单说：

- `tags` 更像主题标签。
- `concepts` 更像知识点。
- `skills` 更像动作和能力。

### 5.7 summary 规则

`summary` 必须回答两个问题：

1. 这条知识是干什么的？
2. 谁在什么场景下会用它？

推荐写法：

> 一个真正可执行的挑战条目，包含目标、流程、交付要求、常见错误和可复用点，供学生完成首个 AI 助手任务时使用。

### 5.8 source 规则

当前阶段 `source` 先记录源文件路径或内容来源，方便演示和回溯。

示例：

```text
../knowledge-base/02-challenges/sample-challenge-knowledge.md
```

后端阶段可以继续映射为：

- 原始 Markdown 路径
- 来源链接
- 内容上传来源

## 6. relationships 规则

关系字段不能只藏在正文里，应该显式写出来。

当前建议统一使用以下谓词：

| 谓词 | 含义 | 例子 |
| --- | --- | --- |
| `includes` | 包含 | 课程包含挑战 |
| `requires` | 需要 | 挑战需要某项技能或提示词 |
| `supports` | 支持 | 提示词支持挑战 |
| `usesPrompt` | 使用提示词 | 项目案例使用某提示词 |
| `relatedTo` | 相关 | 两个条目主题相关 |
| `assessedBy` | 被某标准评估 | 挑战被某评分标准评估 |

建议：

1. `challenge`、`prompt`、`project` 三类条目至少补 1 个关系。
2. 关系目标优先写稳定 ID。
3. 如果暂时没有稳定 ID，可以先写 `targetLabel`，后续再补实体化连接。

## 7. 搜索规则

### 7.1 默认优先级

当前统一采用：

```text
keywords > title > type > tags > concepts > skills > audience > relationships > summary > content
```

这个顺序的目的很明确：

- 先匹配用户真正想找的知识类型和关键词。
- 再看标题和主题。
- 最后才把摘要和正文作为补充。

### 7.2 为什么这样设计

例如用户搜索“挑战”时：

- 如果一条记录的 `type = challenge` 或 `keywords` 里有“挑战”，它应排在前面。
- 课程条目即使正文里提到了“挑战”，也不应排在挑战条目前面。

这条规则对 MVP 演示、后端搜索和未来 Agent 检索都很重要。

## 8. 最小提交流程

当前建议 Builder 贡献一条知识时，最少走下面几步：

1. 判断类型，放到正确目录。
2. 填写最小必填字段。
3. 补充关键词，确保能被自然搜索命中。
4. 如果是挑战、提示词、项目案例，尽量补一个关系字段。
5. 标记状态为 `draft`。
6. 提交 GitHub，进入 Review。

## 9. 最小验收标准

一条知识在当前阶段可以认为“合格”，至少满足：

1. 类型正确，目录正确。
2. 标题清楚，不模糊。
3. `summary` 能说清用途。
4. `audience` 至少 1 个。
5. `keywords` 至少 3 个。
6. 搜索一个自然关键词时，它能被命中。
7. `source` 可追溯。
8. 状态字段存在。

如果要达到“可稳定复用”，建议再满足：

1. 有 `tags`、`concepts`、`skills`。
2. 有至少 1 条显式关系。
3. 有 `situation`、`workflow`、`evaluation`、`knowledgeGrowth`。

## 10. 与后端模型的对应关系

这份规范不是只给文档用的，后端后续可以直接承接。

| 当前规范字段 | 后端建议模型 |
| --- | --- |
| `id` / `title` / `type` / `status` | `knowledge_items` 主表 |
| `summary` / `situation` / `workflow` / `evaluation` / `knowledgeGrowth` | `knowledge_items` 主表文本字段 |
| `audience` | `knowledge_item_audiences` |
| `tags` | `knowledge_item_tags` |
| `keywords` | `knowledge_item_keywords` |
| `concepts` | `knowledge_item_concepts` |
| `skills` | `knowledge_item_skills` |
| `relationships` | `knowledge_relationships` |
| `source` | `knowledge_items.source` |

字段命名建议：

- Markdown/frontmatter 里可暂时保留 `updated`
- 后端接口统一使用 `updatedAt`
- 前后端通过映射层转换，不强行让作者在第一阶段就背两套规则

## 11. 示例

### 11.1 Markdown frontmatter 示例

```yaml
---
id: kb-challenge-001
title: 构建你的第一个 AI 助手
type: challenge
audience:
  - student
  - teacher
keywords:
  - 挑战
  - 任务
  - AI 助手
  - Challenge
tags:
  - week-1
  - ai-assistant
concepts:
  - 提示词工程
  - 角色定义
skills:
  - 编写系统提示
  - 评估输出质量
status: draft
updated: 2026-07-01
source: ../knowledge-base/02-challenges/sample-challenge-knowledge.md
related:
  - kb-course-001
relationships:
  - predicate: usesPrompt
    target: kb-prompt-001
summary: 一个真正可执行的挑战条目，说明任务目标、交付物和常见错误。
---
```

### 11.2 后端 API 示例

```json
{
  "id": "kb-challenge-001",
  "title": "构建你的第一个 AI 助手",
  "type": "challenge",
  "status": "draft",
  "summary": "一个真正可执行的挑战条目，说明任务目标、交付物和常见错误。",
  "audience": ["student", "teacher"],
  "keywords": ["挑战", "任务", "AI 助手", "Challenge"],
  "tags": ["week-1", "ai-assistant"],
  "concepts": ["提示词工程", "角色定义"],
  "skills": ["编写系统提示", "评估输出质量"],
  "related": ["kb-course-001"],
  "relationships": [
    {
      "predicate": "usesPrompt",
      "target": "kb-prompt-001"
    }
  ],
  "source": "../knowledge-base/02-challenges/sample-challenge-knowledge.md"
}
```

## 12. 当前审批点

这份文档建议你重点审批下面 4 个点：

1. 是否确认当前 8 类知识类型不变。
2. 是否确认当前阶段最小必填字段采用 8 项：`id`、`title`、`type`、`summary`、`audience`、`keywords`、`status`、`source`。
3. 是否确认搜索继续采用 metadata-first，优先级保持 `keywords > title > type ...`。
4. 是否确认底层枚举用英文稳定值，页面展示和说明用中文。

## 13. 下一步建议

如果这份规范审批通过，下一步就可以继续两件事：

1. 按这份规范把现有样例条目补齐到更真实的内容。
2. 再基于这份规范去更新 Schema、模板和后端接口草案。

先把规则立住，后面的活才是连续的，不会今天前端一套、明天后端一套。
