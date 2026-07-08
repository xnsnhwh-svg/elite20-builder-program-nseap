#!/usr/bin/env node
/**
 * 批量为所有知识条目添加 agentNotes 字段
 * 格式：触发条件 + 能力范围 + 限制说明
 */
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "knowledge-db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const agentNotesMap = {
  "kb-overview-001":
    "触发条件：用户问知识库是什么、Knowledge Base 有什么用、NSEAP 知识层介绍时检索。" +
    "能力范围：解释知识库在 Elite20 Builder Program 中的定位、设计目标和使用方式。" +
    "限制：不含具体操作指南或 API 调用方法，需联动 kb-agent-002 补充架构细节。",

  "kb-course-001":
    "触发条件：学生问第一周学什么、Week 1 怎么开始、课程安排，或教师问 Week 1 覆盖哪些内容时检索。" +
    "能力范围：提供 Vibe Coding 第一周的学习路径、目标和节奏安排。" +
    "限制：仅覆盖 Week 1，后续周次需查阅对应课程条目；不包含具体挑战的提交规则。",

  "kb-challenge-001":
    "触发条件：学生问第一个 AI 助手怎么做、入门挑战要交什么、怎么判断做得好不好时检索。" +
    "能力范围：提供挑战目标、必交材料清单、评估维度和参考路径。" +
    "限制：不含 Rubric 评分细节（需查 Rubric 条目）；不能替代教师评审判断。" +
    "联动：kb-prompt-001（编程教练提示词）、kb-course-001（课程上下文）。",

  "kb-prompt-001":
    "触发条件：Agent 需要以教练方式引导学生调试代码、而非直接给出答案时检索。" +
    "能力范围：提供 Coding Coach 提示词模板，适用于帮助学生在调试中学习底层概念。" +
    "限制：仅适用于编程调试场景；不适用于写作、设计或非代码类任务。" +
    "联动：kb-challenge-001（挑战背景）。",

  "kb-faq-001":
    "触发条件：学生问不理解挑战怎么办、能用 AI 完成作业吗、提交格式是什么等新手入门问题时检索。" +
    "能力范围：覆盖学生常见的课程理解、提交流程和 AI 使用规范问题。" +
    "限制：仅回答学生视角问题；教师和 Builder 问题分别见 kb-faq-002 和 kb-faq-003。",

  "kb-faq-002":
    "触发条件：教师问怎么复用这个课程、如何评估 AI 辅助作业、教学设计建议时检索。" +
    "能力范围：覆盖教师对课程复用、AI 辅助评估和教学实施的常见疑问。" +
    "限制：仅面向教师视角；不含学生操作指南或技术开发问题。",

  "kb-faq-003":
    "触发条件：Builder 问新知识条目放哪里、需要填 metadata 吗、怎么贡献知识时检索。" +
    "能力范围：覆盖 Builder 在知识库贡献流程、元数据规范和条目结构方面的常见问题。" +
    "限制：不含 API 技术实现细节；不适用于最终用户（学生/教师）的使用问题。",

  "kb-best-practice-001":
    "触发条件：Builder 问怎么写文档、模块文档规范是什么、GitHub 提交包怎么准备时检索。" +
    "能力范围：提供文档撰写最佳实践，确保其他团队可复用。" +
    "限制：聚焦文档写作规范，不涉及代码实现或部署流程。",

  "kb-best-practice-002":
    "触发条件：学生问怎么正确使用 AI 辅助学习、AI 使用边界是什么，或教师设计 AI 辅助教学策略时检索。" +
    "能力范围：定义健康的 AI 辅助学习模式，包括何时该用 AI、何时该自己思考。" +
    "限制：不含具体提示词模板（需联动 kb-prompt-001）；不作为学术诚信判定依据。",

  "kb-best-practice-003":
    "触发条件：用户问 AI 为什么听不懂数据分析需求、大数据任务怎么写 Prompt、怎么减少 AI 生成无效代码时检索。" +
    "能力范围：提供 Metadata-First 方法论——先给 AI 数据字典、业务约束和目标指标，再执行分析。" +
    "限制：适用于结构化数据分析场景；非结构化文本任务（如写作、翻译）不适用此方法。" +
    "联动：kb-project-002（C2S 项目案例演示此方法）。",

  "kb-project-001":
    "触发条件：学生或 Builder 需要一个简单的 AI 助手项目参考案例时检索。" +
    "能力范围：展示项目案例条目应包含的结构（目标、技术栈、成果、反思）。" +
    "限制：仅作为案例模板参考，不含可运行代码；具体技术实现需查阅对应代码仓库。",

  "kb-project-002":
    "触发条件：用户搜索大数据、C2S、Metadata-First、语义对齐、KSTAR、AAR、作品集案例时检索。" +
    "能力范围：展示一个完整的学生项目案例：术语翻译→结构化理解→改进方案→AAR 复盘。" +
    "限制：是特定学生的作品记录，不可直接作为通用模板；实操方法论需联动 kb-best-practice-003。",

  "kb-agent-001":
    "触发条件：讨论知识库的自动化管理、Agent 协作架构或 Knowledge Librarian 角色设计时检索。" +
    "能力范围：定义未来 Knowledge Librarian Agent 的职责——帮助用户查找、组织和改进知识条目。" +
    "限制：目前是设计占位符，尚未实现为可执行 Agent；不包含实际 Agent 调用接口。",

  "kb-agent-002":
    "触发条件：解释知识库如何与 NSEAP 认知细胞架构对齐、或说明 Knowledge Cognitive Cell 定位时检索。" +
    "能力范围：阐述知识库作为认知细胞在 AI 学习操作系统中的结构化定位。" +
    "限制：是架构设计文档，不包含具体 API 实现或数据结构细节；实现细节需查看代码。",

  "kb-upload-1782957815322":
    "触发条件：查找 C2S Challenge 原始文档或了解 C2S 挑战的完整定义时检索。" +
    "能力范围：提供 C2S Challenge 的原始要求文档（由 docx 上传生成的草稿）。" +
    "限制：这是自动生成草稿，metadata 不完整；权威版本以教师发布的最终 Challenge 为准。",

  "kb-upload-1782957986593":
    "触发条件：查看 C2S 大数据方向提交范例或学生实际提交物时检索。" +
    "能力范围：提供一份聚焦大数据应用的 C2S Challenge 学生提交实例。" +
    "限制：是特定学生提交的原始记录，不代表标准答案；评估需结合 Rubric 条目。",

  "kb-upload-1783135052354":
    "触发条件：需要了解本体抽取方法论、T-Box/R-Box/A-Box 概念或如何从文档生成结构化本体时检索。" +
    "能力范围：提供本体抽取的专用技能定义，将领域文档转化为三元组结构。" +
    "限制：是方法论描述，不含可直接执行的代码脚本；具体实现需对接 Ontology Team 工具链。"
};

let updated = 0;
db.entries.forEach((entry) => {
  const notes = agentNotesMap[entry.id];
  if (notes) {
    entry.agentNotes = notes;
    entry.updatedAt = new Date().toISOString();
    updated++;
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + "\n", "utf8");
console.log(`Done: updated agentNotes for ${updated}/${db.entries.length} entries.`);
