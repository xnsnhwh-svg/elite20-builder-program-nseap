# Knowledge Cognitive Cell MVP 汇报说明

## 一句话定位

我们第 6 组做的是 **NSEAP 知识认知细胞 MVP**。

它不是一个普通文档文件夹，而是一个可以演示的静态 Demo + 结构化知识源，用来把课程、挑战、提示词、FAQ、项目案例和 Agent 上下文沉淀为可检索、可复用、可被 Agent 使用、未来可图谱化的知识资产。

## 我们为什么这么做

老师的 Builder Program 目标不是交 PPT，而是交一个可复制、可部署、可持续演化的教育产品。

所以 Knowledge Team 不能只整理资料。我们的任务应该是建立知识层的最小产品原型：

```text
Markdown 知识源
+ YAML metadata
+ concepts / skills / relationships
+ 静态 Demo App
+ GitHub 提交流程
```

这对应未来 FDE Workbench 里的两个产品能力：

- Knowledge Repository（知识仓库）
- Prompt Studio（提示词工作室）

## MVP 当前能演示什么

- 浏览知识条目
- 按课程、挑战、提示词、项目、Agent 分类筛选
- 搜索标题、标签、概念、技能、适用对象
- 用真实 C2S 大数据项目案例测试搜索、分类和关系展示
- 查看条目的 metadata、concepts、skills、relationships
- 展示知识增长流程：场景 -> 本体 -> 流程 -> 技能 -> 评估 -> 学习 -> 知识增长
- 从 Demo 跳回源 Markdown 文件

## Cognitive Cell 映射

```text
Identity：
Knowledge Cognitive Cell / Knowledge Team / 未来的 Knowledge Librarian Agent

Capability：
知识组织、模板标准化、提示词管理、FAQ 管理、最佳实践沉淀、项目案例沉淀、metadata 标注、评审流程

Interface：
静态 Demo App、Markdown、YAML frontmatter、JSON Schema、GitHub PR，未来可扩展到 API / MCP

Product Position：
未来 FDE Workbench 中 Knowledge Repository + Prompt Studio 的最小原型
```

## 参考文件对我们的作用

```text
CognitiveCell：给我们 NSEAP 的总架构语言，一切皆认知细胞。
P2807.8：给我们知识图谱和教育本体方向。
P3394：给我们未来 Agent Interface / Manifest 方向。
P3428：给我们能力等级和评估方向。
Tech-discussions：给我们内部工程路线，也就是 OKF + FDE Workbench + Knowledge Repository + Prompt Studio。
```

## 我们如何服务其他组

### Curriculum Team

把 weekly plan、learning objectives、lecture notes 转成可复用课程知识。

### Challenge Team

把 Challenge 转成结构化条目，包括目标、步骤、交付物、评分方式、常见错误、相关提示词和知识增长。

### Agent Team

提供结构化上下文、提示词样例、FAQ 和 metadata，让 Agent 可以更干净地检索知识。

### Ontology Team

提供 concepts、skills、relationships，作为未来 ontology node / edge 的输入。

### Platform Team

提供一个干净的 Markdown 内容源和静态 Demo，未来可接 GitHub Pages、文档门户、LMS、API 或 FDE Workbench。

### Demo Team

提供清楚的展示故事：项目知识不再散落，而是变成结构化、可检索、可复用、可被 Agent 使用的知识资产。

## Demo 流程

1. 打开 `app/index.html`。
2. 展示知识条目列表。
3. 按 Course / Challenge / Prompt / Project / Agent 筛选。
4. 搜索 `大数据`，展示真实 C2S 项目案例和 Metadata-First 最佳实践。
5. 搜索 `Metadata-First`，说明搜索优先匹配 metadata，而不是只扫全文。
6. 搜索 `挑战`，说明系统会优先返回挑战条目，同时也能带出相关项目案例。
7. 打开 C2S 项目案例，展示 audience、keywords、concepts、skills、relationships。
8. 展示“场景 -> 本体 -> 流程 -> 技能 -> 评估 -> 学习 -> 知识增长”。
9. 点击源 Markdown，说明 Demo 背后是结构化知识源。
10. 打开 Metadata-First 最佳实践，说明项目经验可以沉淀成可复用规则。
8. 打开 `docs/builder-workflow.md`，说明我们遵守老师的 Builder Workflow。
9. 打开 `docs/nseap-technical-series-alignment.md`，说明 OKF + FDE Workbench 对齐。
10. 结尾说明未来可升级为 Knowledge Librarian Agent。

## 汇报时可以这样说

我们第 6 组不是简单整理资料，而是做 Knowledge Cognitive Cell 的第一版 MVP。

第一版我们没有追求收集全部课程内容，而是先做出一个能演示、能扩展、能提交 GitHub 的最小原型。它包含一个静态 Demo App、结构化知识源、真实 C2S 项目案例、知识条目模板、JSON Schema、Builder Workflow 和 GitHub 贡献流程。

这个 MVP 当前是 L2 标准化知识库，正在为 L3 Agent-ready 知识库做准备。未来它可以接入知识图谱、Agent 检索、FDE Workbench，并演化为 Knowledge Librarian Agent。
