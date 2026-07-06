const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const knowledgeDir = path.join(rootDir, "knowledge-base");
const searchIndexPath = path.join(rootDir, "app", "search-index.json");
const outputPath = path.join(rootDir, "app", "knowledge-data.json");

const CATEGORY_ORDER = [
  { id: "all", label: "全部" },
  { id: "overview", label: "概览" },
  { id: "course", label: "课程" },
  { id: "challenge", label: "挑战" },
  { id: "prompt", label: "提示词" },
  { id: "faq", label: "FAQ" },
  { id: "best-practice", label: "最佳实践" },
  { id: "project", label: "项目案例" },
  { id: "agent", label: "Agent" }
];

const FLOW = ["场景", "本体", "流程", "技能", "评估", "学习", "知识增长"];

const AUDIENCE_LABELS = {
  student: "学生",
  teacher: "教师",
  builder: "Builder",
  agent: "Agent"
};

const EXTRA_KEYWORDS_BY_TYPE = {
  overview: ["概览", "知识库", "介绍"],
  course: ["课程", "学习路径", "课程安排"],
  challenge: ["挑战", "任务", "练习"],
  prompt: ["提示词", "Prompt", "指令"],
  faq: ["FAQ", "常见问题", "问答"],
  "best-practice": ["最佳实践", "实践", "方法"],
  project: ["项目", "项目案例", "案例"],
  agent: ["Agent", "智能体", "检索"]
};

const DEFAULTS_BY_TYPE = {
  overview: {
    situation: "适合在介绍知识模块整体作用、结构和边界时使用。",
    ontology: "知识条目、分类结构、模板规范与检索规则。",
    workflow: "阅读总览 -> 理解分类 -> 进入具体条目 -> 持续补充与更新。",
    skill: "快速理解模块定位与知识结构。",
    evaluation: "使用者能否快速理解知识模块的作用、结构和使用方式。",
    knowledgeGrowth: "随着课程和项目推进，持续补充分层条目、关系和检索规则。"
  },
  course: {
    situation: "适合在梳理课程目标、学习路径和配套挑战时使用。",
    ontology: "课程单元、学习目标、挑战、提示词与反思要求。",
    workflow: "查看课程目标 -> 理解学习任务 -> 找到配套挑战和提示词 -> 开始执行。",
    skill: "理解学习路径、定位配套资源。",
    evaluation: "学习者能否按课程路径理解目标并开始执行。",
    knowledgeGrowth: "课程中的问题、案例和提示词可以继续沉淀为 FAQ、项目案例和最佳实践。"
  },
  challenge: {
    situation: "适合在解释挑战目标、交付物和评估方式时使用。",
    ontology: "挑战场景、交付要求、提示词、评估标准与反思。",
    workflow: "理解挑战 -> 完成交付 -> 测试和调整 -> 提交结果与反思。",
    skill: "拆解任务、完成交付、用 AI 协助迭代。",
    evaluation: "挑战目标是否清晰、交付物是否完整、反思是否到位。",
    knowledgeGrowth: "优秀挑战产出可继续沉淀为提示词、FAQ 和项目案例。"
  },
  prompt: {
    situation: "适合在查找可复用提示词和指令模式时使用。",
    ontology: "角色设定、输入要求、输出形式与适用边界。",
    workflow: "选择场景 -> 复用提示词 -> 测试输出 -> 根据结果调整。",
    skill: "提示词复用、调试和迭代。",
    evaluation: "提示词是否能稳定支撑具体任务并保持输出质量。",
    knowledgeGrowth: "高质量提示词和调试经验会继续沉淀为最佳实践和 FAQ。"
  },
  faq: {
    situation: "适合在回答高频问题、减少重复解释时使用。",
    ontology: "问题、场景、标准回答与后续行动建议。",
    workflow: "定位问题 -> 查看标准回答 -> 跟进相关条目或执行建议。",
    skill: "快速定位问题、理解标准规则。",
    evaluation: "用户能否通过 FAQ 独立解决高频问题。",
    knowledgeGrowth: "新的高频问题可以继续补充到 FAQ 中，优化检索命中率。"
  },
  "best-practice": {
    situation: "适合在沉淀可复用经验、避免重复踩坑时使用。",
    ontology: "目标、做法、检查点、常见错误与复用建议。",
    workflow: "查看实践原则 -> 对照检查 -> 应用到自己的任务中。",
    skill: "规范化产出、沉淀经验、复用方法。",
    evaluation: "他人是否可以直接照着实践完成同类工作。",
    knowledgeGrowth: "新的经验和反馈会不断更新最佳实践条目。"
  },
  project: {
    situation: "适合在展示真实项目做法、拆解案例结构时使用。",
    ontology: "项目目标、用户场景、流程、提示词与产出形式。",
    workflow: "理解案例背景 -> 查看方案结构 -> 复用到自己的项目中。",
    skill: "案例分析、结构拆解、方案复用。",
    evaluation: "案例是否能帮助他人快速理解做法并迁移复用。",
    knowledgeGrowth: "新项目案例会持续丰富知识库的实战参考。"
  },
  agent: {
    situation: "适合在说明未来 Agent 如何调用和使用知识条目时使用。",
    ontology: "Agent 角色、能力、接口、上下文来源与检索方式。",
    workflow: "查看 Agent 角色 -> 理解输入输出 -> 对接知识条目或上下文。",
    skill: "Agent 检索准备、上下文组织、接口理解。",
    evaluation: "Agent 是否能正确识别并调用这类知识条目。",
    knowledgeGrowth: "随着后端和 Agent 接入，条目会继续补充接口、能力和调用规则。"
  }
};

function walkMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(fullPath);
    if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];
    return [];
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function frontmatterEnd(content) {
  if (!content.startsWith("---")) return 0;
  const end = content.indexOf("\n---", 3);
  return end === -1 ? 0 : end + 4;
}

function countIndent(line) {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function splitKeyValue(line) {
  const index = line.indexOf(":");
  if (index === -1) return [line.trim(), ""];
  return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
}

function cleanValue(value) {
  return String(value || "").replace(/^["']|["']$/g, "").trim();
}

function parseArrayBlock(lines, startIndex, indent) {
  const items = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const currentIndent = countIndent(line);
    if (currentIndent < indent || !line.trimStart().startsWith("- ")) break;

    const itemText = line.trimStart().slice(2);

    if (!itemText.includes(":")) {
      items.push(cleanValue(itemText));
      index += 1;
      continue;
    }

    const [firstKey, firstValue] = splitKeyValue(itemText);
    const objectItem = {};
    objectItem[firstKey] = cleanValue(firstValue);
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index];
      if (!nextLine.trim()) {
        index += 1;
        continue;
      }

      const nextIndent = countIndent(nextLine);
      if (nextIndent <= currentIndent) break;

      const [key, value] = splitKeyValue(nextLine.trim());
      objectItem[key] = cleanValue(value);
      index += 1;
    }

    items.push(objectItem);
  }

  return { value: items, nextIndex: index };
}

function parseFrontmatter(content) {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end === -1) return {};

  const lines = content.slice(3, end).split(/\r?\n/);
  const data = {};

  let index = 0;
  while (index < lines.length) {
    const rawLine = lines[index];
    if (!rawLine.trim()) {
      index += 1;
      continue;
    }

    const keyMatch = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) {
      index += 1;
      continue;
    }

    const key = keyMatch[1];
    const inlineValue = keyMatch[2].trim();

    if (inlineValue) {
      data[key] = cleanValue(inlineValue);
      index += 1;
      continue;
    }

    const { value, nextIndex } = parseArrayBlock(lines, index + 1, 2);
    data[key] = value;
    index = nextIndex;
  }

  return data;
}

function normalizeHeading(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function cleanMarkdown(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```[a-zA-Z0-9_-]*\n?/g, "").replace(/\r?\n+/g, " ").trim()
    )
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSections(body) {
  const lines = body.split(/\r?\n/);
  const sections = [];
  const intro = [];
  let title = "";
  let currentSection = null;
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      if (currentSection) currentSection.lines.push(line);
      else intro.push(line);
      continue;
    }

    if (!inCodeFence && /^#\s+/.test(trimmed)) {
      if (!title) {
        title = trimmed.replace(/^#\s+/, "").trim();
        continue;
      }
    }

    if (!inCodeFence && /^##+\s+/.test(trimmed)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        heading: trimmed.replace(/^##+\s+/, "").trim(),
        lines: []
      };
      continue;
    }

    if (currentSection) currentSection.lines.push(line);
    else intro.push(line);
  }

  if (currentSection) sections.push(currentSection);

  return { title, intro, sections };
}

function sectionText(section) {
  return section ? cleanMarkdown(section.lines.join("\n")) : "";
}

function introText(parsed) {
  return cleanMarkdown(parsed.intro.join("\n"));
}

function matchSection(parsed, aliases) {
  const normalizedAliases = new Set(aliases.map(normalizeHeading));
  return parsed.sections.find((section) => normalizedAliases.has(normalizeHeading(section.heading)));
}

function truncate(text, maxLength = 110) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

function uniqueStrings(values) {
  const result = [];
  const seen = new Set();

  for (const value of values) {
    const cleaned = cleanValue(value);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function normalizeAudience(values) {
  return uniqueStrings(values.map((value) => AUDIENCE_LABELS[value] || value));
}

function normalizeRelationships(value) {
  return normalizeArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const predicate = cleanValue(item.predicate);
      const target = cleanValue(item.target);
      const targetLabel = cleanValue(item.targetLabel);
      if (!predicate) return null;
      return {
        predicate,
        ...(target ? { target } : {}),
        ...(targetLabel ? { targetLabel } : {})
      };
    })
    .filter(Boolean);
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim());
}

function buildSummary(meta, parsed, type) {
  if (meta.summary) return meta.summary;

  if (type === "faq") {
    const questions = parsed.sections
      .map((section) => section.heading.replace(/^Q:\s*/i, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    if (questions.length) {
      return `常见问题：${questions.join("；")}`;
    }
  }

  const text = firstNonEmpty(
    sectionText(matchSection(parsed, ["Purpose", "用途", "概述", "Summary", "简介"])),
    introText(parsed),
    ...parsed.sections.map(sectionText)
  );

  return truncate(text || `${meta.title || parsed.title} 的知识条目。`);
}

function buildSituation(meta, parsed, type) {
  return firstNonEmpty(
    sectionText(matchSection(parsed, ["Situation", "适用对象与场景", "When To Use", "Use Case", "使用场景", "Context"])),
    DEFAULTS_BY_TYPE[type]?.situation
  );
}

function buildOntology(meta, parsed, type, related) {
  const explicit = sectionText(
    matchSection(parsed, ["Ontology", "本体", "本体 / 结构说明", "Content", "内容", "Identity", "核心对象", "结构说明"])
  );
  if (explicit) return explicit;

  const headings = parsed.sections
    .map((section) => section.heading)
    .filter(Boolean)
    .slice(0, 5);

  if (headings.length) return headings.join("、");
  if (related.length) return `相关条目：${related.join("、")}`;
  return DEFAULTS_BY_TYPE[type]?.ontology;
}

function buildWorkflow(meta, parsed, type) {
  return firstNonEmpty(
    sectionText(matchSection(parsed, ["Workflow", "流程", "Checklist", "Practice", "Static to Evolutionary Path", "步骤"])),
    DEFAULTS_BY_TYPE[type]?.workflow
  );
}

function buildSkill(meta, parsed, type, skills) {
  return firstNonEmpty(
    sectionText(matchSection(parsed, ["Skill", "Skills", "技能", "Capability", "Capabilities", "Practice"])),
    skills.length ? skills.join("、") : "",
    DEFAULTS_BY_TYPE[type]?.skill
  );
}

function buildEvaluation(meta, parsed, type) {
  return firstNonEmpty(
    sectionText(matchSection(parsed, ["Evaluation", "评估", "Rubric"])),
    DEFAULTS_BY_TYPE[type]?.evaluation
  );
}

function buildKnowledgeGrowth(meta, parsed, type) {
  return firstNonEmpty(
    sectionText(matchSection(parsed, ["Knowledge Growth", "Knowledge Growth Loop", "知识增长", "Future Capabilities", "未来能力"])),
    DEFAULTS_BY_TYPE[type]?.knowledgeGrowth
  );
}

function buildEntry(filePath, searchLookup) {
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const meta = parseFrontmatter(content);
  if (!meta.id) return null;

  const body = content.slice(frontmatterEnd(content));
  const parsed = parseSections(body);
  const type = cleanValue(meta.type) || "overview";
  const audience = normalizeAudience(normalizeArray(meta.audience));
  const tags = uniqueStrings(normalizeArray(meta.tags));
  const baseKeywords = uniqueStrings(normalizeArray(meta.keywords));
  const concepts = uniqueStrings(normalizeArray(meta.concepts));
  const skills = uniqueStrings(normalizeArray(meta.skills));
  const relatedFromMeta = uniqueStrings(normalizeArray(meta.related));
  const relationships = normalizeRelationships(meta.relationships);
  const relatedFromRelationships = uniqueStrings(
    relationships.map((item) => item.target).filter(Boolean)
  );
  const related = uniqueStrings([...relatedFromMeta, ...relatedFromRelationships]);
  const additionalKeywords = EXTRA_KEYWORDS_BY_TYPE[type] || [];
  const searchIndexItem = searchLookup.get(meta.id);
  const searchKeywords = normalizeArray(searchIndexItem?.keywords);
  const keywords = uniqueStrings([...baseKeywords, ...searchKeywords, ...additionalKeywords]);
  const relativePath = path.relative(rootDir, filePath).replaceAll("\\", "/");

  return {
    id: meta.id,
    title: cleanValue(meta.title) || parsed.title || path.basename(filePath, ".md"),
    type,
    status: cleanValue(meta.status) || "draft",
    audience,
    tags,
    keywords,
    concepts,
    skills,
    related,
    relationships,
    summary: buildSummary(meta, parsed, type),
    situation: buildSituation(meta, parsed, type),
    ontology: buildOntology(meta, parsed, type, related),
    workflow: buildWorkflow(meta, parsed, type),
    skill: buildSkill(meta, parsed, type, skills),
    evaluation: buildEvaluation(meta, parsed, type),
    knowledgeGrowth: buildKnowledgeGrowth(meta, parsed, type),
    source: cleanValue(meta.source) || `../${relativePath}`,
    searchText: cleanValue(searchIndexItem?.searchText || "")
  };
}

function buildKnowledgeData() {
  const searchIndex = readJson(searchIndexPath);
  const categoryRank = new Map(CATEGORY_ORDER.map((category, index) => [category.id, index]));
  const searchLookup = new Map(
    searchIndex
      .filter((item) => item && item.id && typeof item.searchText === "string")
      .map((item) => [item.id, item])
  );

  const entries = walkMarkdownFiles(knowledgeDir)
    .map((filePath) => buildEntry(filePath, searchLookup))
    .filter(Boolean)
    .sort((a, b) => {
      const rankDiff = (categoryRank.get(a.type) ?? 999) - (categoryRank.get(b.type) ?? 999);
      return rankDiff || a.id.localeCompare(b.id);
    });

  const payload = {
    meta: {
      name: "NSEAP 知识认知细胞 MVP",
      version: "0.1.0",
      level: "L2 标准化知识库，正在为 L3 Agent-ready 知识库做准备",
      position: "面向未来 FDE Workbench 的知识仓库 + 提示词工作室最小原型",
      sourceMode: "markdown-auto-generated"
    },
    categories: CATEGORY_ORDER,
    flow: FLOW,
    entries
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Built ${entries.length} knowledge items -> ${path.relative(rootDir, outputPath)}`);
}

buildKnowledgeData();
