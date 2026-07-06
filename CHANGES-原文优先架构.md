# 原文优先架构（C方案）改动说明

> 改动日期：2026-07-05

## 为什么改

之前老师带练页展示的是 `summary`、`concepts`、`skills` 等加工后的 metadata，不是原文。阅读地图像"字段总结"，不像"原文理解路径"。

**根因**：上传时只把正文抽取结果用于 LLM 分析生成 metadata，没把完整原文存下来；带练页只能拿到加工结果，自然像"对应总结"。

## 核心变化

带练页现在展示的是**实际原文段落**，按文档结构（标题/段落）分块对齐，老师注解叠加在原文之上。

## 改动清单

### 后端（`server/server.js`）

| 改动 | 说明 |
|---|---|
| `chunkText()` | 按段落+标题拆分原文为 chunk 数组（id/type/heading） |
| `loadOriginalSource()` | 从 `knowledge-base/` 读取静态条目的原始 markdown 正文 |
| `migrateAllEntries()` | 启动时自动为存量条目补 `extractedText` + `chunks` |
| `buildReadingMap()` | 重写，三个策略分层：有标题→按章节对齐，无标题→按段落均分，无原文→回退 metadata |
| `sanitizeEntry()` | 新增 `extractedText` 和 `chunks` 字段 |
| `buildUploadEntry()` | 上传时自动存完整原文并分块 |
| `buildGuidedFieldMappings()` | 字段映射增加 `chunkRef`（"定位到第X段"） |
| 启动迁移 | `server.listen` 时自动执行 `migrateAllEntries()` |

### 前端（`app/index.html`）

| 改动 | 说明 |
|---|---|
| 左侧栏 | 导航显示 `chunkRef`（如"第2-4段"）代替 `sourcePart` |
| 中间栏 | 展示**原文段落** + 老师指导 + 带练步骤，三层结构 |
| 右侧栏 | 字段映射增加"定位到: 第X段"提示 |

## 数据模型

每条知识条目新增两个字段：

```json
{
  "extractedText": "完整原文文本...",
  "chunks": [
    { "id": "chunk-0", "text": "## 用途", "type": "heading", "heading": "用途" },
    { "id": "chunk-1", "text": "这条知识用来...", "type": "paragraph", "heading": "用途" }
  ]
}
```

## 阅读地图对齐策略

1. **有标题的文档**（如 `knowledge-base/` 下的静态 markdown）→ 按 `##` 标题关键词映射到 5 个阅读区（概览/概念/流程/产出/复用）
2. **无标题的正文** → 按段落数量均分到 4 个区
3. **完全无原文**（旧上传条目）→ 回退到原来的 metadata 展示

## 存量数据兼容

- `knowledge-base/` 下的静态条目 → 启动时自动从 source 文件补原文 ✓
- 旧上传条目（`kb-upload-*`）→ 原文不可恢复，回退显示 metadata ✓
- 新上传条目 → 自动存原文+分块 ✓

## 前端布局 v2：全文展示 + 当前高亮 + 右栏步骤（2026-07-05）

用户反馈 "看不到原文" → 重新设计三栏布局：

### 新布局

```
┌────────┬────────────────────────────┬──────────────────┐
│ 220px  │         1fr                │     310px        │
│        │                            │                  │
│ 阅读地图│ 原文全文（完整显示）       │ 当前带练步骤      │
│        │   ┌─────────────────┐      │                  │
│ 01概览 │   │ 📍 当前高亮段落  │      │ 标题             │
│ 02概念←│   │  实际原文内容     │      │ 老师给你讲       │
│ 03流程 │   └─────────────────┘      │ 小检查           │
│ 04产出 │   ┌─────────────────┐      │ 定位信息         │
│ 05复用 │   │ 其他段落         │      │ [上一步][下一步]  │
│        │   └─────────────────┘      │ ───────────       │
│        │                            │ 对应知识字段      │
│        │                            │                  │
└────────┴────────────────────────────┴──────────────────┘
```

### 具体改动

| 改动 | 说明 |
|---|---|
| 中间栏改为"原文全文" | 展示 entry 的**所有 chunk**，不是只显示当前 section 的片段 |
| chunk 级高亮 | 当前阅读区对应的 chunk 加蓝色左边框 + 浅蓝背景 + "📍 当前" 小标签 |
| 标题 / 段落区分 | heading type 的 chunk 显示为粗体标题 + HEADING 标识，段落显示为正文 |
| 右栏改为"当前带练步骤" | 步骤标题 → 老师给你讲 → 小检查 → 定位信息 → 导航按钮 → 字段映射 |
| 左栏缩窄 | 280px → 220px，给原文更多空间 |
| 无 chunk 回退 | 旧条目无原文分块时，直接显示 `originalText` 纯文本 |
| 步骤与原文同步 | 点击左栏阅读区或使用上下步，中间高亮段落跟随变化 |

### 前端 JS 新增变量

- `guidedAllChunks` — 从 `selectedEntry.chunks` 构建，每条含 `displayText`（heading 自动去 `##` 前缀）、`active`（是否属于当前 section）、`heading`/`para` 布尔
- `guidedAllChunksEmpty` — 无 chunk 时回退显示 `originalText`

### 相关数据流

1. 后端 `buildReadingMap()` 返回的每个 section 包含 `chunkIds: ["chunk-0", "chunk-1"]`
2. 前端通过 `S.selectedId` 查找完整 entry（含 `chunks[]`），与 `guidedCurrentSource.chunkIds` 做交集
3. 当前 section 的 `chunkIds` 落在哪个 chunk 上，那个 chunk 就高亮

## 类似项目调研

| 项目 | 做法 | 对本项目的启发 |
|---|---|---|
| **shiji-kb**（史记知识库） | 阅读页以**原文为中心**（占 60%+ 页面），段落有 Purple Numbers（紫色编号）作为锚点。侧栏展示实体/事件导航，点击跳转到对应段落。原文永远是主体，标注/注解浮在原文上。 | 原文应当是页面主角。段落编号 + 高亮当前位置，侧栏仅做导航和辅助信息。 |
| **Hypothesis**（网页批注） | 保留原始网页完整显示，用户高亮任意段落添加批注。右侧栏显示批注线程。批注通过 CSS selector 或文本锚点定位到原文。 | 批注/指导应该"附着"在原文上，而不是独立展示。原文不变，注解叠加上去。 |
| **Readwise Reader** | 阅读视图显示完整文章，高亮段落自动出现在右侧边栏。不同颜色高亮对应不同标签。 | 段落可以有多层标注（老师指导 + 检查问题），颜色/标签区分不同类型。 |
| **Perusall**（社交阅读） | 左侧显示原文 PDF/网页，右侧显示评论和问题。老师可以在段落上直接提问，学生回答出现在侧栏。段落级锚点 + 侧栏讨论。 | "老师带练"类似于 Perusall 的"老师提问"场景——原文段落 + 侧栏指导。 |
| **Claude Artifacts / NotebookLM** | 原文在左，AI 生成的分析/问答在右。引用原文时用段落编号回指（如 "根据第3段..."）。 | 生成内容回指原文段落号，用户能双向跳转。 |

### 核心结论

原文优先架构的共同模式：
1. **原文是主体**（占主要版面），不被裁剪或隐藏
2. **段落有稳定 ID**（编号或锚点），annotation/guide 通过 ID 附着在段落上
3. **侧栏做辅助**（导航、批注、问答），不喧宾夺主
4. **高亮/颜色标记活性区域**（当前阅读位置、已读/未读）

当前实现完整覆盖 1-3 点。第 4 点（段落标记）可以作为后续迭代方向。

## 段落锚点滚动（2026-07-05）

### 目标
点击左栏阅读区、或使用"上一步/下一步"时，中间栏自动滚动到当前 section 的第一个 chunk，确保"当前"高亮段落始终在可视区域。

### 改动

| 改动 | 位置 | 说明 |
|---|---|---|
| `id="chunk-{{ chunk.id }}"` | 模板 sc-for 内 div | 每个 chunk div 获得 DOM ID，格式如 `chunk-chunk-0`、`chunk-chunk-1` |
| `scrollToActiveChunk()` | 类方法（line ~1755） | 从 `this.state.guidedPath.readingMap[step].chunkIds[0]` 取第一个 chunk ID，`getElementById` + `scrollIntoView({ behavior:'smooth', block:'center' })` |
| guidedNext 回调 | line 1748 | `setState` 第二个参数 `() => this.scrollToActiveChunk()` |
| guidedPrev 回调 | line 1752 | 同上 |
| 阅读地图 onClick | line 2561 | `setState` 后 `setTimeout(() => this.scrollToActiveChunk(), 80)` |
| 初始加载 | line 1729 | `setState` 回调触发首次滚动 |

### 触发时机
- 首次进入带练页 ✓
- 点击左栏任意阅读区 ✓
- 点击"上一步"/"下一步" ✓
- 最后一步完成时（不滚动，显示完成消息） ✓

### 验证方法
打开带练页，点击左栏不同阅读区或使用"下一步"按钮，观察中间栏是否自动滚动到蓝色高亮段落。

## metadata 校验（2026-07-05）

### 目标
知识条目提交时校验 L1 必填字段（title/summary/keywords/audience），符合 DESIGN.md Section 8.2/8.7 标准。前端实时提示 + 提交拦截 + 服务端二次校验。

### 改动

**前端（`index.html`）**

| 改动 | 位置 | 说明 |
|---|---|---|
| `formErrors` 计算 | render 函数 | 实时校验 title/summary/keywords，生成错误消息 |
| `formHasErrors` | render 函数 | 任意字段有误时 true |
| `mfErrors` / `mfHasErrors` | render 函数 | 实时校验 metadata 表单的 keywords/audience |
| 标题输入框 | 新增行内错误 + 红色边框 | 空值时显示"请输入标题"，边框变红 |
| 摘要输入框 | 同上 | 空值时显示"请输入一句话摘要" |
| 关键词输入框 | 同上 + 计数 | 不足 3 个时显示"至少 3 个关键词（当前 N 个）" |
| 提交按钮 | 不变 | 不 disable，但提交时拦截 |
| metadata 关键词 | 新增行内错误 | 同上计数校验 |
| metadata 适用对象 | 新增行内错误 | 空值时显示"至少 1 个适用对象" |
| `submit()` | 方法内新增校验 | summary 空 + kw < 3 时 return |
| `updateMetadata()` | 方法内新增校验 | kw < 3 或 audience 空时 return |

**服务端（`server.js`）**

| 改动 | 位置 | 说明 |
|---|---|---|
| POST /api/knowledge | line ~1942 | 校验 title/summary/keywords，不满足返回 400 |
| PATCH /api/knowledge/:id | line ~1874 | 校验 keywords（3+）/audience（1+），不满足返回 400 |

### L1 校验规则（对齐 DESIGN.md Section 8.7）
- title: 非空 ✓
- summary: 非空 ✓
- keywords: ≥ 3 个 ✓
- audience: ≥ 1 个（metadata 编辑时校验） ✓
- status: 始终有默认值（draft） ✓
- source: 仅上传场景有，不强制 ✓

## KSTAR δR 追踪（2026-07-05）

### 目标
把 KSTAR 闭环做到老师带练里。每步的"小检查"不再只是展示文本，而是让学生提交答案，记录作答情况，在完成时算 δR（完成率）。

### KSTAR → 带练映射

| KSTAR | 带练中对应 | 说明 |
|---|---|---|
| K (Knowledge) | 当前阅读区的原文内容 | 学生正在学的东西 |
| S (Situation) | 这条知识的使用场景 | 字段映射中的 usage |
| T (Task) | 当前步骤的 teacherScript | "老师给你讲" |
| A (Action) | 学生提交小检查答案 | **新增：答案输入** |
| R (Result) | 答案是否提交 | **新增：δR 完成率** |
| δR | 已作答步数 / 总步数 × 100% | 完成时展示 |

### 改动

| 改动 | 位置 | 说明 |
|---|---|---|
| `guidedAnswers:{}` | state 初始化 | 存储 `{ stepIndex: { answer, submittedAt } }` |
| `guidedAnswerInput:""` | state 初始化 | 当前 textarea 输入 |
| `submitGuidedAnswer()` | 类方法 | 保存当前步答案到 guidedAnswers |
| `guidedCurrentAnswer` | render 计算 | 当前步的答案文本 |
| `guidedCurrentAnswerDone/Needed` | render 计算 | 是否已答 |
| 小检查区块 | 模板 | 未答: textarea + 提交按钮；已答: "✓ 已作答" + 答案展示 |
| 完成消息 | `guidedNext()` | 显示 "你完成了 X/Y 道小检查（Z%）" |
| 重置 | `closeGuidedPath()` / 开始带练 | 清空 answers |

### δR 计算
```
δR = (已作答步数 / 总步数) × 100%
```
当前为简单版本：只看是否提交了答案，不判对错。后续可加参考答案比对或教师评审。

## KSTAR 参考答案比对（2026-07-05）

### 目标
小检查提交后用 LLM 比对学生的答案 vs 参考答案，自动判正误，δR 变成得分率而不是简单的完成率。

### 核心概念：KSTAR 在带练里的完整闭环

| KSTAR | 带练中对应 | 之前 | 现在 |
|---|---|---|---|
| **K** (Knowledge) | 当前阅读区原文 | ✅ 展示 | ✅ 展示 |
| **S** (Situation) | 字段映射 usage | ✅ 展示 | ✅ 展示 |
| **T** (Task) | teacherScript | ✅ 展示 | ✅ 展示 |
| **A** (Action) | **学生写答案** | ❌ 被动阅读 | ✅ textarea + 提交 |
| **R** (Result) | **LLM 判分结果** | ❌ 无 | ✅ correct/partial/wrong |
| **δR** (Delta Result) | **综合得分率** | ❌ 无 | ✅ 加权平均分 |

### 改动

#### 服务端（`server.js`）

| 改动 | 行号 | 说明 |
|---|---|---|
| `makeGuidedStep()` 加 `referenceAnswer` 参数 | ~440 | 每步带参考答案 |
| Prompt 规则模板 3 步 | ~763-815 | 每步加了具体参考答案 |
| 通用模板 3 步 | ~789-837 | 同上 |
| `buildGuidedPathWithLlm` 的 prompt 结构 | ~880 | 加 `referenceAnswer` 字段 |
| LLM 步骤映射 | ~933 | 映射 referenceAnswer |
| `POST /api/guided/check-answer` | ~1842 | **新增**：LLM 比对端点 |

**新增端点 `POST /api/guided/check-answer`**
- 入参：`{ question, studentAnswer, referenceAnswer }`
- 内部：调 LLM 比对，temperature 0.2，max_tokens 400，15s 超时
- 返回：`{ correct: true|false|"partial", score: 0~1, feedback, summary }`
- 容错：LLM 不可用时返回 `{ correct: true, score: 1 }` 默认通过

#### 前端（`index.html`）

| 改动 | 说明 |
|---|---|
| `submitGuidedAnswer()` | 提交后异步调 `/api/guided/check-answer` |
| `guidedCurrentGrading` + 4 个布尔值 | pending/correct/partial/wrong 状态 |
| 小检查模板 | pending: ⏳ 正在评判 / correct: ✓ 理解正确 + 反馈 / partial: △ 部分正确 + 反馈 / wrong: ✗ 有出入 + 反馈 |
| 完成消息 | 显示 "正确 X · 部分 Y · 有出入 Z" 明细 |
| δR 计算 | 基于 `score` 字段算加权平均分（0~100%） |
| `guidedCurrent.referenceAnswer` | 传给模板用于调用判分接口 |

### δR 计算（新）
```
δR = (Σ 每步 score) / 总步数 × 100%
```
其中 score: 正确=1, 部分=0.5, 错误=0

## 搜索质量改进（2026-07-05）

### 目标
把搜索从简单关键词 `includes()` 升级为带权重、模糊匹配、语义重排序、结果片段展示的系统。

### 现有问题
- 纯 `includes()` 匹配，输入"提示词"搜不到"Prompt"（无同义词/语义）
- 所有字段匹配算一样权重（title 和 searchText 出现一次算一样）
- 无匹配片段展示，用户不知道哪里匹配了
- 无模糊匹配，少写一个字就搜不到

### 改动

#### 服务端（`server.js`）

| 改动 | 行号 | 说明 |
|---|---|---|
| `fieldWeights` 常量 | ~30 | 每个搜索字段的权重值（keywords=10, title=8, ..., searchText=1） |
| `fuzzyMatchTokens()` | ~233 | 新增：字符级模糊匹配，逐字匹配支持 60% 容错 |
| `extractSnippet()` | ~248 | 新增：从匹配位置提取上下文片段 |
| `searchEntries()` 重写 | ~260 | 改用 fuzzyMatch + 权重打分 + snippet 生成 |
| 搜索结果排序 | ~288 | 改为按 score 降序（之前按 fieldPriority 顺序） |
| `GET /api/search` | ~1885 | 返回结果增加 `score` 和 `snippet` 字段 |
| `POST /api/search/deep` | ~1893 | **新增**：LLM 语义重排序端点 |

**`fuzzyMatchTokens()` 模糊匹配逻辑**
- 先尝试精确子串匹配（full token match → score += 2）
- 不命中则逐字扫描：query 字符必须在原文中按顺序出现
- 匹配比例 ≥ 60% 才算命中
- 最终 score = Σ 各字段 fuzzyScore × fieldWeight

**`extractSnippet()` 片段提取**
- 在 `searchText` 中定位 query 位置
- 取前后约 80 字符的上下文
- 超出范围用 `...` 截断

**`POST /api/search/deep` 深度搜索**
- 入参：`{ query, category }`
- 先用关键词搜索取 top 20
- 送 LLM 按语义相关性重排
- temperature 0.15, max_tokens 1200, 20s 超时
- 返回 top 10（含 reason）
- LLM 不可用 / 超时 → 回退关键词结果

#### 前端（`index.html`）

| 改动 | 说明 |
|---|---|
| `deepBusy` / `deepDone` | state 新增，跟踪深度搜索状态 |
| `deepSearch()` | 类方法，调 POST /api/search/deep |
| `setSearch()` | 重置 `deepDone:false` |
| `setCategory()` | 重置 `deepDone:false` |
| `searchFromApi()` | 接收 `score` + `snippet` 字段 |
| `snippetVisible` / `snippet` | listItems 新增，展示匹配片段 |
| 搜索信息栏 | 显示数据源 + 结果数，增加"深度搜索"按钮 |
| 搜索结果卡片 | 新增灰色匹配片段区域（snippet !== summary 时显示） |

### 效果
```
之前: 搜"提示词" → 只有标题含"提示词"的才出现
现在: 搜"提示词" → 标题(title)+关键词(keywords)优先，正文(searchText)也匹配，
      模糊匹配"提是词"也能搜到，点"深度搜索"让 LLM 按语义重排

之前: 只显示"命中 title · keywords"
现在: 还显示匹配片段和权重分
```

## 关键文件

- `server/server.js` — 主要后端逻辑，新增 `graphRelationLabel()` 函数 + `/api/knowledge/:id/export-md` 端点
- `app/index.html` — 前端模板，新增 `exportMarkdown()`/`exportJson()` 方法 + 列表「⋯」菜单 + 详情头导出按钮
- `data/knowledge-db.json` — 数据存储
- `knowledge-base/` — 静态 markdown 源文件

### 2026-07-06 — 知识复用：Markdown/JSON 导出

**问题**：知识条目只能在本系统内查看，无法导出为可移植文件（归档、分享、二次加工）。

**改动**：

**后端**（`server/server.js`）：
1. 新增 `GET /api/knowledge/:id/export-md?mode=light|full` 端点
   - 返回 `Content-Type: text/markdown`，浏览器自动触发下载
   - 服务端查关系 `targetLabel`，保证 Markdown 中关系条目名称完整
2. 新增 `graphRelationLabel()` 工具函数，映射关系谓词为中文标签

**前端**（`app/index.html`）：
1. 新增 `exportMarkdown(id, mode)` 方法 — 请求服务端 → Blob → `<a download>`
2. 新增 `exportJson(id)` 方法 — `JSON.stringify()` → Blob → `<a download>`（纯客户端，零后端开销）
3. **列表项「⋯」菜单**：每行条目右侧 hover 出三点按钮，点击弹出导出下拉菜单（Markdown 轻量/Markdown 完整/JSON）
4. **详情标题区「⋯」按钮**：在"开始带练"同一行加导出入口，同样三选项
5. 全局 click 监听关闭导出菜单

**Markdown 轻量模式**：标题 → 类型标签 → 状态 → 摘要 → 关键词 → 适用对象 → 核心概念 → 核心技能
**Markdown 完整模式**：以上 + 交付物 → 原文段落（chunks 按 heading 分段） → 知识关系（含 target 标题） → 审计记录 → 导出时间戳+条目 ID

```
之前: 无法导出，条目数据锁在系统内
现在: 列表和详情都有导出入口，Markdown 两种模式 + JSON，开箱即用
```

## 后续改动记录

### 2026-07-06 — 条目质量管控：状态流转 + 审核流程

**问题**：知识条目创建后没有状态管理，无法区分草稿、审核中、已发布、已归档；审核过程无记录。

**改动**：

**后端**（`server/server.js`）：
1. 新增 `PATCH /api/knowledge/:id` — 更新条目 metadata（之前只有 POST）
2. 新增 `POST /api/knowledge/:id/transition` — 状态流转
   - 规则：draft → review → stable → archived，stable/archived 均可回 draft
   - draft → review 时校验 L1 字段（keywords≥3, audience≥1, summary 非空）
3. 新增 `POST /api/knowledge/:id/review` — 审核通过/驳回
   - 仅 review 状态可审核，通过→stable，驳回→draft
4. 新增 `GET /api/knowledge/:id/audit-log` — 审计日志
5. 修复：`knowledgeActionMatch` 独立 regex 匹配子路由，避免与 `knowledgeIdMatch` 冲突

**前端**（`app/index.html`）：
1. 条目列表上方增加**状态过滤器 chips**（全部/ draft/ review/ stable/ archived）
2. 详情侧边栏 "状态" 标签后显示**流转按钮**（如 draft → "提交审核"）
3. review 状态时显示**审核面板**（审核意见 textarea + 通过/驳回按钮）
4. 有审计日志时显示**"查看审核记录"**折叠入口，展开后按时间倒序展示操作 + 时间 + 备注
5. 方法 `transitionStatus()`、`reviewEntry()` 绑定到按钮，自动更新本地状态

```
之前: 无状态管理，全部条目混在列表，无审核流程
现在: draft → review → stable → archived 完整流转，审核需 approve/reject 决策，全程记录
```

## 关键文件
