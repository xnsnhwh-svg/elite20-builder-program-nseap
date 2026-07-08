const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { KnowledgeStore } = require("./store");

const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");
// JSON 镜像路径（仍供 GitHub review / 导出；可用 KB_DB_PATH 覆盖，测试用）
const dbPath = process.env.KB_DB_PATH
  ? path.resolve(process.env.KB_DB_PATH)
  : path.join(rootDir, "data", "knowledge-db.json");
// SQLite 运行时真源（可用 KB_SQLITE_PATH 覆盖，测试指向临时文件）
const sqlitePath = process.env.KB_SQLITE_PATH
  ? path.resolve(process.env.KB_SQLITE_PATH)
  : path.join(rootDir, "data", "knowledge.db");
const runtimeConfigPath = process.env.RUNTIME_CONFIG_PATH
  ? path.resolve(process.env.RUNTIME_CONFIG_PATH)
  : path.join(rootDir, "data", "runtime-config.json");
const uploadDir = path.join(rootDir, "data", "uploads");
const port = Number(process.env.PORT || 8787);
const defaultLlmBaseUrl = "https://api.openai.com/v1";
const defaultLlmModel = "gpt-4o-mini";
const uploadJobs = new Map();

const typeMeta = {
  overview: "概览",
  course: "课程",
  challenge: "挑战",
  prompt: "提示词",
  faq: "FAQ",
  "best-practice": "最佳实践",
  project: "项目案例",
  agent: "Agent",
  rubric: "Rubric"
};

const fieldPriority = [
  "keywords",
  "title",
  "type",
  "tags",
  "concepts",
  "skills",
  "deliverables",
  "audience",
  "summary",
  "searchText"
];

const fieldWeights = {
  keywords: 10,
  title: 8,
  type: 6,
  tags: 6,
  concepts: 5,
  skills: 5,
  deliverables: 4,
  audience: 4,
  summary: 3,
  searchText: 1
};

const allowedTypes = new Set([
  "overview",
  "course",
  "challenge",
  "prompt",
  "faq",
  "best-practice",
  "project",
  "agent",
  "rubric"
]);

const allowedStatuses = new Set(["draft", "review", "stable", "sample", "deprecated", "archived"]);
const archivedStatuses = new Set(["archived"]);
const allowedPredicates = new Set(["includes", "requires", "supports", "assessedBy", "usesPrompt", "relatedTo", "usesPractice"]);

let _store = null;
function getStore() {
  if (!_store) {
    _store = new KnowledgeStore({
      sqlitePath,
      jsonMirrorPath: dbPath,
      seedJsonPath: dbPath // \u9996\u6B21\u542F\u52A8\u4ECE\u73B0\u6709 JSON \u5E93\u64AD\u79CD
    });
  }
  return _store;
}

// \u6570\u636E\u8BBF\u95EE\u5C42\u59D4\u6258\u7ED9 SQLite \u5B58\u50A8\uFF1B\u8FD4\u56DE\u5BF9\u8C61\u7ED3\u6784\u4E0E\u65E7 JSON \u5E93\u5B8C\u5168\u4E00\u81F4\uFF0CAPI \u5951\u7EA6\u4E0D\u53D8\u3002
function readDb() {
  return getStore().loadDb();
}

function writeDb(db) {
  getStore().saveDb(db);
}

function readRuntimeConfig() {
  if (!fs.existsSync(runtimeConfigPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(runtimeConfigPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return {};
  }
}

function writeRuntimeConfig(config) {
  fs.mkdirSync(path.dirname(runtimeConfigPath), { recursive: true });
  fs.writeFileSync(runtimeConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) {
    return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function uniqueStrings(values) {
  const result = [];
  const seen = new Set();
  for (const value of values || []) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function normalizeKnowledgeType(value, fallback = "project") {
  const type = String(value || "").trim();
  return allowedTypes.has(type) ? type : fallback;
}

function normalizeStatus(value, fallback = "draft") {
  const status = String(value || "").trim();
  return allowedStatuses.has(status) ? status : fallback;
}

function isArchivedEntry(entry) {
  return archivedStatuses.has(String(entry.status || "").trim());
}

function graphRelationLabel(predicate) {
  return ({
    includes:"包含",
    usesPractice:"实践",
    usesPrompt:"提示词",
    supports:"支持",
    requires:"需要",
    assessedBy:"评估",
    relatedTo:"相关"
  })[predicate] || predicate || "相关";
}

function visibleEntries(entries, includeArchived = false) {
  return includeArchived ? entries : entries.filter((entry) => !isArchivedEntry(entry));
}

function sanitizeRelationship(raw, db) {
  const data = raw && typeof raw === "object" ? raw : {};
  const predicate = String(data.predicate || "").trim();
  if (!allowedPredicates.has(predicate)) {
    const error = new Error("relationship predicate is invalid");
    error.statusCode = 400;
    throw error;
  }

  const target = String(data.target || "").trim();
  const targetEntry = target && db && Array.isArray(db.entries)
    ? db.entries.find((entry) => entry.id === target)
    : null;
  const targetLabel = String(data.targetLabel || (targetEntry ? targetEntry.title : "")).trim();

  if (!target && !targetLabel) {
    const error = new Error("relationship target or targetLabel is required");
    error.statusCode = 400;
    throw error;
  }

  return {
    id: String(data.id || `rel-${Date.now()}`).trim(),
    predicate,
    target,
    targetLabel,
    note: String(data.note || "").trim(),
    createdAt: data.createdAt || new Date().toISOString()
  };
}

function normalizeRelationships(value, fallback = [], db = null) {
  if (!Array.isArray(value)) return fallback;
  const relationships = [];
  for (const item of value) {
    try {
      relationships.push(sanitizeRelationship(item, db));
    } catch {
      // Ignore invalid imported relationships; explicit API calls still return validation errors.
    }
  }
  return relationships;
}

function normalizeProcessingRelations(value, fallback = []) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return source
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      predicate: String(item.predicate || "relatedTo").trim(),
      targetHint: String(item.targetHint || item.targetLabel || item.target || "").trim(),
      reason: String(item.reason || item.note || "").trim()
    }))
    .filter((item) => item.targetHint || item.reason)
    .slice(0, 6);
}

function normalizeKnowledgeProcessing(value, fallback = {}) {
  const data = value && typeof value === "object" ? value : {};
  const base = fallback && typeof fallback === "object" ? fallback : {};
  const pickText = (name) => String(data[name] || base[name] || "").trim();
  const pickList = (name) => {
    const primary = normalizeArray(data[name]);
    return (primary.length ? primary : normalizeArray(base[name])).slice(0, 8);
  };

  return {
    classificationReason: pickText("classificationReason"),
    coreProblem: pickText("coreProblem"),
    keyPoints: pickList("keyPoints"),
    suggestedRelations: normalizeProcessingRelations(data.suggestedRelations, base.suggestedRelations),
    missingFields: pickList("missingFields"),
    nextActions: pickList("nextActions")
  };
}

function searchableText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(" ");
  return String(value);
}

function matchesTokens(value, tokens) {
  const text = searchableText(value).toLowerCase();
  return text && tokens.every((token) => text.includes(token));
}

function fuzzyMatchTokens(value, tokens) {
  const text = searchableText(value).toLowerCase();
  if (!text) return 0;
  let score = 0;
  for (const token of tokens) {
    if (text.includes(token)) {
      score += 2;
      continue;
    }
    let pos = -1, matched = 0;
    for (const ch of token) {
      pos = text.indexOf(ch, pos + 1);
      if (pos === -1) break;
      matched++;
    }
    const ratio = matched / token.length;
    if (ratio >= 0.6) score += ratio;
  }
  return score;
}

function extractSnippet(text, query, maxLen = 80) {
  const t = String(text || "");
  if (!t) return "";
  const lower = t.toLowerCase();
  const q = query.toLowerCase().trim();
  let idx = lower.indexOf(q);
  if (idx === -1) {
    for (const ch of q) {
      const found = lower.indexOf(ch);
      if (found !== -1) { idx = found; break; }
    }
    if (idx === -1) return t.slice(0, maxLen);
  }
  const start = Math.max(0, idx - Math.floor(maxLen / 3));
  const end = Math.min(t.length, idx + q.length + Math.floor(maxLen / 2));
  let snippet = t.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < t.length) snippet += "...";
  return snippet;
}

function searchEntries(entries, query, category = "all", options = {}) {
  const includeArchived = options.includeArchived === true;
  const activeEntries = visibleEntries(entries, includeArchived);
  const scopedEntries = category === "all"
    ? activeEntries
    : activeEntries.filter((entry) => entry.type === category);
  const tokens = String(query || "").toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (!tokens.length) {
    return scopedEntries.map((entry) => ({ entry, matchedFields: [], score: 0, snippet: "" }));
  }

  const results = scopedEntries
    .map((entry) => {
      const matchedFields = [];
      let totalScore = 0;
      const typeLabel = typeMeta[entry.type] || entry.type;
      const checks = [
        { field: "keywords", value: entry.keywords },
        { field: "title", value: entry.title },
        { field: "type", value: [entry.type, typeLabel] },
        { field: "tags", value: entry.tags },
        { field: "concepts", value: entry.concepts },
        { field: "skills", value: entry.skills },
        { field: "deliverables", value: entry.deliverables },
        { field: "audience", value: entry.audience },
        { field: "summary", value: entry.summary },
        { field: "searchText", value: entry.searchText }
      ];
      for (const { field, value } of checks) {
        const score = fuzzyMatchTokens(value, tokens);
        if (score > 0) {
          matchedFields.push(field);
          totalScore += score * (fieldWeights[field] || 1);
        }
      }
      const snippet = matchedFields.length > 0
        ? extractSnippet(entry.searchText || entry.summary, query)
        : "";
      return { entry, matchedFields, score: totalScore, snippet };
    })
    .filter((result) => result.matchedFields.length);

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.title.localeCompare(b.entry.title, "zh-CN");
  });

  return results;
}

function compactKnowledgeEntry(entry) {
  if (!entry) return null;
  return {
    id: entry.id,
    title: entry.title,
    type: entry.type,
    status: entry.status,
    summary: entry.summary || "",
    keywords: normalizeArray(entry.keywords).slice(0, 6),
    concepts: normalizeArray(entry.concepts).slice(0, 4),
    skills: normalizeArray(entry.skills).slice(0, 4),
    deliverables: normalizeArray(entry.deliverables).slice(0, 4)
  };
}

// ---- Agent 检索上下文（DESIGN 7.4 / 9.1，V0.3 预留基础版）----

// 状态可信度：让 Agent 优先拿到可信内容。archived 已在 visibleEntries 过滤。
const statusTrust = { stable: 4, sample: 3, review: 2, draft: 1, deprecated: 0 };

// role 到 audience 的匹配：audience 中英混存，两边都要能命中。
const roleAudienceAliases = {
  student: ["student", "学生"],
  teacher: ["teacher", "教师", "老师"],
  builder: ["builder", "Builder"],
  agent: ["agent", "Agent", "智能体"]
};

function entryMatchesRole(entry, role) {
  if (!role) return true;
  const wanted = roleAudienceAliases[String(role).toLowerCase()] || [String(role)];
  const wantedLower = wanted.map((v) => v.toLowerCase());
  const audience = normalizeArray(entry.audience).map((v) => String(v).toLowerCase());
  return audience.some((a) => wantedLower.includes(a));
}

// 把一条知识整理成 Agent 可直接引用的结构化上下文（带出处与显式关系）。
function toAgentContextItem(entry, matchedFields = [], score = 0) {
  return {
    id: entry.id,
    title: entry.title,
    type: entry.type,
    typeLabel: typeMeta[entry.type] || entry.type,
    status: entry.status,
    trust: statusTrust[entry.status] || 0,
    summary: entry.summary || "",
    audience: normalizeArray(entry.audience),
    keywords: normalizeArray(entry.keywords),
    concepts: normalizeArray(entry.concepts),
    skills: normalizeArray(entry.skills),
    relationships: (Array.isArray(entry.relationships) ? entry.relationships : []).map((r) => ({
      predicate: r.predicate,
      target: r.target || "",
      targetLabel: r.targetLabel || ""
    })),
    agentNotes: entry.agentNotes || "",
    citation: { id: entry.id, title: entry.title, source: entry.source || "" },
    matchedFields,
    score
  };
}

function buildAgentContext(entries, { query = "", role = "", type = "all", limit = 8 } = {}) {
  const category = allowedTypes.has(type) ? type : "all";
  const ranked = searchEntries(entries, query, category)
    .filter((r) => entryMatchesRole(r.entry, role));

  // 无查询词时 searchEntries 返回 score=0 的全量，此时按可信度+更新时间排序兜底。
  const sorted = query.trim()
    ? ranked.sort((a, b) => {
        const t = (statusTrust[b.entry.status] || 0) - (statusTrust[a.entry.status] || 0);
        if (t !== 0) return t;
        return b.score - a.score;
      })
    : ranked.sort((a, b) => {
        const t = (statusTrust[b.entry.status] || 0) - (statusTrust[a.entry.status] || 0);
        if (t !== 0) return t;
        return String(b.entry.updatedAt || "").localeCompare(String(a.entry.updatedAt || ""));
      });

  const capped = Math.max(1, Math.min(Number(limit) || 8, 20));
  return sorted.slice(0, capped).map((r) => toAgentContextItem(r.entry, r.matchedFields, r.score));
}

function slugText(value) {
  const encoded = encodeURIComponent(String(value || "").trim().toLowerCase());
  return encoded
    .replace(/%/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "node";
}

function structureNodeId(parentId, subtype, title) {
  return `structure-${parentId}-${subtype}-${slugText(title)}`;
}

function projectStructureGroups(entry) {
  if (entry.type !== "project") return [];
  return [
    {
      subtype: "concept",
      type: "concept",
      label: "概念",
      values: normalizeArray(entry.concepts).slice(0, 8)
    },
    {
      subtype: "skill",
      type: "skill",
      label: "技能",
      values: normalizeArray(entry.skills).slice(0, 8)
    },
    {
      subtype: "deliverable",
      type: "deliverable",
      label: "交付物",
      values: normalizeArray(entry.deliverables).slice(0, 8)
    }
  ];
}

function relationshipEntries(entry, entries) {
  const byId = new Map(entries.map((item) => [item.id, item]));
  const ids = [
    ...normalizeArray(entry.related),
    ...(Array.isArray(entry.relationships) ? entry.relationships.map((item) => item.target) : [])
  ].filter(Boolean);
  const seen = new Set();
  const result = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const target = byId.get(id);
    if (!target || isArchivedEntry(target)) continue;
    seen.add(id);
    result.push(target);
  }
  return result;
}

function buildKnowledgeGraph(db, options = {}) {
  const includeArchived = options.includeArchived === true;
  const entries = visibleEntries(db.entries, includeArchived);
  const nodeMap = new Map();
  const linkMap = new Map();
  const degreeMap = new Map();

  const addNode = (node) => {
    if (!node || !node.id || nodeMap.has(node.id)) return;
    nodeMap.set(node.id, node);
    degreeMap.set(node.id, new Set());
  };

  const addLink = (source, target, predicate, note = "") => {
    if (!source || !target || source === target || !nodeMap.has(source) || !nodeMap.has(target)) return;
    const key = `${source}->${target}:${predicate || "relatedTo"}`;
    if (linkMap.has(key)) return;
    linkMap.set(key, {
      id: `link-${source}-${target}-${predicate || "relatedTo"}`,
      source,
      target,
      predicate: predicate || "relatedTo",
      note
    });
    degreeMap.get(source).add(target);
    degreeMap.get(target).add(source);
  };

  for (const entry of entries) {
    addNode({
      ...compactKnowledgeEntry(entry),
      kind: "document",
      virtual: false
    });
  }

  for (const entry of entries) {
    for (const group of projectStructureGroups(entry)) {
      for (const title of uniqueStrings(group.values)) {
        const id = structureNodeId(entry.id, group.subtype, title);
        addNode({
          id,
          title,
          type: group.type,
          status: "structure",
          summary: `${entry.title} 项目中的${group.label}节点，用于说明项目内部包含关系。`,
          keywords: [entry.title, title, group.label],
          concepts: group.subtype === "concept" ? [title] : [],
          skills: group.subtype === "skill" ? [title] : [],
          deliverables: group.subtype === "deliverable" ? [title] : [],
          kind: "structure",
          subtype: group.subtype,
          parentId: entry.id,
          sourceEntryId: entry.id,
          virtual: true
        });
        addLink(entry.id, id, "includes", `项目包含${group.label}: ${title}`);
      }
    }
  }

  for (const entry of entries) {
    for (const rel of Array.isArray(entry.relationships) ? entry.relationships : []) {
      addLink(entry.id, rel.target, rel.predicate, rel.note || "");
    }
    for (const target of normalizeArray(entry.related)) {
      addLink(entry.id, target, "relatedTo");
    }
  }

  const links = [...linkMap.values()];
  const nodes = [...nodeMap.values()].map((node) => ({
    ...node,
    degree: degreeMap.get(node.id).size
  }));

  return {
    nodes,
    links,
    stats: {
      nodeCount: nodes.length,
      linkCount: links.length,
      documentNodeCount: nodes.filter((node) => node.kind === "document").length,
      structureNodeCount: nodes.filter((node) => node.kind === "structure").length
    }
  };
}

function pickRelatedByType(entry, entries, types) {
  const allowed = new Set(types);
  return relationshipEntries(entry, entries).find((item) => allowed.has(item.type)) || null;
}

function makeGuidedStep(order, title, entry, teacherScript, checkQuestion, reason, referenceAnswer) {
  return {
    order,
    title,
    entry: compactKnowledgeEntry(entry),
    teacherScript,
    checkQuestion,
    reason,
    referenceAnswer: referenceAnswer || checkQuestion,
    actionLabel: order === 1 ? "开始看这一段" : "我懂了，下一步"
  };
}

// 无 LLM 时的兜底判分：基于参考答案关键词的重合度。
// 中文按 2-gram + 数字/字母词切分，去掉停用词，比纯字数更能反映"有没有答到点上"。
// 返回 correct 用 partial/false/unknown 三档；unknown 用于参考答案本身无有效关键词（无法判断）的情况。
function gradeAnswerByKeywordOverlap(studentAnswer, referenceAnswer) {
  const stop = new Set(["的","了","和","与","是","在","有","这","那","你","我","它","们","一个","一条","什么","如何","怎么","可以","应该","需要","以及","或者","还是","不是","就是","这条","这个","那个","知识","任务","答案","问题","参考","回答","比如","如","等","把","被","让","会","要","能","对","从","到","为","也","都","而","并","其","之","于","即","该"]);
  const extract = (text) => {
    const raw = String(text || "").toLowerCase();
    const tokens = new Set();
    // 英文/数字词
    (raw.match(/[a-z0-9]+/g) || []).forEach((w) => { if (w.length >= 2) tokens.add(w); });
    // 中文 2-gram
    const zh = raw.replace(/[^一-龥]/g, "");
    for (let i = 0; i < zh.length - 1; i++) {
      const bigram = zh.slice(i, i + 2);
      if (!stop.has(bigram)) tokens.add(bigram);
    }
    return tokens;
  };
  const refTokens = extract(referenceAnswer);
  const stuTokens = extract(studentAnswer);
  const studentLen = String(studentAnswer || "").trim().length;

  if (refTokens.size === 0) {
    // 参考答案没有可比对的关键词（比如是开放式判据），无法客观判分，交给用户自查。
    return {
      correct: "unknown",
      score: 0,
      feedback: "（未配置 LLM）这道小检查是开放题，系统无法自动判分。请对照参考答案自查，配置 LLM 后可获得针对性反馈。",
      pending: true
    };
  }
  if (studentLen < 5) {
    return { correct: false, score: 0, feedback: "（未配置 LLM）回答太短，看不出你的理解，请展开说说。" };
  }
  let hit = 0;
  refTokens.forEach((t) => { if (stuTokens.has(t)) hit++; });
  const overlap = hit / refTokens.size;
  if (overlap >= 0.5) {
    return { correct: true, score: 1, feedback: `（未配置 LLM，基于关键词重合度约 ${Math.round(overlap * 100)}%）覆盖了参考答案的主要点，判为理解到位。配置 LLM 后可获得更准确评判。` };
  }
  if (overlap >= 0.2) {
    return { correct: "partial", score: 0.5, feedback: `（未配置 LLM，基于关键词重合度约 ${Math.round(overlap * 100)}%）答到了部分要点，建议对照参考答案补充后重试。` };
  }
  return { correct: false, score: 0, feedback: "（未配置 LLM，关键词重合度较低）回答似乎没答到参考答案的要点，请再想想或对照参考答案调整。" };
}

function textOrFallback(value, fallback) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function chunkText(text) {
  if (!text || !text.trim()) return [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  const chunks = [];
  let heading = '';
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;
    const hm = p.match(/^(#{1,3})\s+(.+)/);
    if (hm) { heading = hm[2]; chunks.push({ id: `chunk-${chunks.length}`, text: p, type: 'heading', heading }); }
    else { chunks.push({ id: `chunk-${chunks.length}`, text: p, type: 'paragraph', heading }); }
  }
  return chunks;
}

function loadOriginalSource(source) {
  if (!source) return '';
  const relative = source.replace(/^\.\.\//, '');
  const fullPath = path.resolve(rootDir, relative);
  if (!fs.existsSync(fullPath)) return '';
  try {
    const content = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
    const end = content.startsWith('---') ? content.indexOf('\n---', 3) : -1;
    return end === -1 ? content.trim() : content.slice(end + 5).trim();
  } catch { return ''; }
}

function migrateAllEntries(db) {
  let changed = false;
  for (const entry of db.entries) {
    if (entry.extractedText) continue;
    const text = loadOriginalSource(entry.source);
    if (text) {
      entry.extractedText = text;
      entry.chunks = chunkText(text);
      changed = true;
    }
  }
  if (changed) writeDb(db);
  return changed;
}

function sectionChunkRange(chunks) {
  const ids = chunks.map(c => parseInt(c.id.replace('chunk-', ''), 10)).filter(n => !isNaN(n));
  if (!ids.length) return '';
  if (ids.length === 1) return `第${ids[0] + 1}段`;
  return `第${Math.min(...ids) + 1}-${Math.max(...ids) + 1}段`;
}

function classifySectionByHeading(heading) {
  const rules = [
    { id: 'doc-concepts', keywords: ['概念', '术语', '本体', 'Ontology', '知识', '对象'] },
    { id: 'doc-workflow', keywords: ['流程', 'Workflow', '方法', '步骤', '技能', '方案', 'Solution', '做法'] },
    { id: 'doc-output', keywords: ['交付', 'Deliverables', '评估', 'Evaluation', '产出', '衡量'] },
    { id: 'doc-reuse', keywords: ['复用', 'Reuse', '关联', '增长', 'Growth', 'Agent Notes', '连接'] }
  ];
  for (const rule of rules) {
    if (rule.keywords.some(kw => heading.includes(kw))) return rule.id;
  }
  return 'doc-other';
}

function buildReadingMap(entry) {
  const chunks = Array.isArray(entry.chunks) ? entry.chunks : [];
  if (!chunks.length || !entry.extractedText) {
    return buildFallbackReadingMap(entry);
  }

  const headingIndices = [];
  chunks.forEach((c, i) => { if (c.type === 'heading') headingIndices.push(i); });

  if (headingIndices.length >= 1) {
    return buildSectionedReadingMap(chunks, headingIndices, entry);
  }

  return buildFlatReadingMap(chunks, entry);
}

function buildFallbackReadingMap(entry) {
  return [
    { id: "doc-overview", title: "文档概览", chunkIds: [], chunkRef: "全文摘要", originalText: entry.summary || entry.extractedTextPreview || "先读标题和摘要，判断这份资料解决什么问题。", annotation: "先建立整体判断", guide: "先建立整体判断：这份资料是什么、为什么要进入知识库。" },
    { id: "doc-concepts", title: "核心概念", chunkIds: [], chunkRef: "概念列表", originalText: normalizeArray(entry.concepts).join("、") || "暂无原文概念", annotation: "理解关键术语", guide: "把原文里反复出现或决定理解门槛的词先圈出来。" },
    { id: "doc-workflow", title: "操作流程", chunkIds: [], chunkRef: "流程说明", originalText: entry.workflow || entry.situation || "暂无原文流程", annotation: "看清操作步骤", guide: "看清这份资料到底教用户怎么做。" },
    { id: "doc-output", title: "产出与评估", chunkIds: [], chunkRef: "交付要求", originalText: [...normalizeArray(entry.deliverables), entry.evaluation].filter(Boolean).join("、") || "暂无原文产出说明", annotation: "检查交付标准", guide: "判断用户读完后应该产出什么。" },
    { id: "doc-reuse", title: "关联与复用", chunkIds: [], chunkRef: "复用建议", originalText: (Array.isArray(entry.relationships) ? entry.relationships.map(r => r.targetLabel || r.target) : []).join("、") || "暂无原文关联", annotation: "找到连接点", guide: "找到它下一步应该连接和服务的对象。" }
  ];
}

function buildSectionedReadingMap(chunks, headingIndices, entry) {
  const sections = [];

  if (headingIndices[0] > 0) {
    const intro = chunks.slice(0, headingIndices[0]);
    sections.push(makeReadingSection('doc-overview', '文档概览', intro, '先读原文开篇，建立整体判断。'));
  }

  for (let i = 0; i < headingIndices.length; i++) {
    const start = headingIndices[i];
    const end = i + 1 < headingIndices.length ? headingIndices[i + 1] : chunks.length;
    const sectionChunks = chunks.slice(start, end);
    const headingText = chunks[start].heading || '';

    const sectionId = classifySectionByHeading(headingText);
    const known = { 'doc-concepts': ['核心概念', '理解关键术语和知识点', '这些原文段落里出现了核心概念。'], 'doc-workflow': ['操作流程', '看清操作步骤', '看清这份资料到底教用户怎么做。'], 'doc-output': ['产出与评估', '检查交付标准', '判断用户读完后应该产出什么。'], 'doc-reuse': ['关联与复用', '找到连接点', '把它放回知识库网络，找到它应该连接的对象。'] };
    const meta = known[sectionId] || [headingText, '深入理解', `仔细阅读「${headingText}」部分。`];

    if (sectionId === 'doc-other' && headingText) {
      sections.push(makeReadingSection(`doc-${start}`, headingText, sectionChunks, `仔细阅读「${headingText}」部分。`));
    } else {
      sections.push(makeReadingSection(sectionId, meta[0], sectionChunks, meta[2]));
    }
  }

  return sections;
}

function buildFlatReadingMap(chunks, entry) {
  const groupSize = Math.max(1, Math.ceil(chunks.length / 4));
  const sections = [
    makeReadingSection('doc-overview', '文档概览', chunks.slice(0, groupSize), '先读原文开篇，建立整体判断。'),
    makeReadingSection('doc-concepts', '核心概念', chunks.slice(groupSize, groupSize * 2), '这些段落可能包含核心概念。'),
    makeReadingSection('doc-workflow', '操作流程', chunks.slice(groupSize * 2, groupSize * 3), '这些段落可能描述操作步骤。'),
    makeReadingSection('doc-output', '产出与评估', chunks.slice(groupSize * 3), '这些段落涉及产出与评估。')
  ];
  return sections.filter(s => s.chunkIds.length > 0);
}

function makeReadingSection(id, title, chunks, guide) {
  return {
    id,
    title,
    chunkIds: chunks.map(c => c.id),
    chunkRef: sectionChunkRange(chunks),
    originalText: chunks.map(c => c.text).join('\n\n'),
    annotation: title,
    guide
  };
}

function buildGuidedFieldMappings(entry, readingMap) {
  const processing = entry.knowledgeProcessing && typeof entry.knowledgeProcessing === "object"
    ? entry.knowledgeProcessing
    : {};
  const relationships = Array.isArray(entry.relationships) ? entry.relationships : [];
  const relationValues = relationships.map((item) => item.targetLabel || item.target).filter(Boolean);
  const sectionByField = {
    summary: 'doc-overview', concepts: 'doc-concepts', ontology: 'doc-concepts',
    workflow: 'doc-workflow', skills: 'doc-workflow', situation: 'doc-workflow',
    deliverables: 'doc-output', evaluation: 'doc-output', knowledgeGrowth: 'doc-output',
    relationships: 'doc-reuse', related: 'doc-reuse'
  };

  function chunkRefForField(field) {
    if (!Array.isArray(readingMap)) return '';
    const sectionId = sectionByField[field];
    if (!sectionId) return '';
    const section = readingMap.find(s => s.id === sectionId);
    return section ? section.chunkRef : '';
  }

  return [
    {
      field: "summary",
      label: "摘要",
      sourcePart: "文档概览",
      values: normalizeArray(entry.summary),
      usage: "帮助用户先用一句话理解原文档的主要用途。",
      chunkRef: chunkRefForField('summary')
    },
    {
      field: "concepts",
      label: "概念",
      sourcePart: "核心概念",
      values: normalizeArray(entry.concepts),
      usage: "对应原文中需要先理解的术语、对象或知识点。",
      chunkRef: chunkRefForField('concepts')
    },
    {
      field: "skills",
      label: "技能",
      sourcePart: "操作流程",
      values: normalizeArray(entry.skills),
      usage: "对应用户读完后应该掌握或执行的动作。",
      chunkRef: chunkRefForField('skills')
    },
    {
      field: "deliverables",
      label: "交付物",
      sourcePart: "产出与评估",
      values: normalizeArray(entry.deliverables),
      usage: "对应原文里要求产出的作品、文档或结果。",
      chunkRef: chunkRefForField('deliverables')
    },
    {
      field: "relationships",
      label: "知识关系",
      sourcePart: "关联与复用",
      values: relationValues,
      usage: "对应这份资料应该连接到哪些课程、挑战、案例、提示词或最佳实践。",
      chunkRef: chunkRefForField('relationships')
    },
    {
      field: "nextActions",
      label: "下一步行动",
      sourcePart: "关联与复用",
      values: normalizeArray(processing.nextActions),
      usage: "对应用户读完文档后可以继续完成的动作。",
      chunkRef: ''
    }
  ];
}

function buildGuidedPath(entry, db) {
  const entries = visibleEntries(db.entries, false);
  const prompt = pickRelatedByType(entry, entries, ["prompt"]);
  const project = pickRelatedByType(entry, entries, ["project"]);
  const challenge = pickRelatedByType(entry, entries, ["challenge"]);
  const bestPractice = pickRelatedByType(entry, entries, ["best-practice"]);
  const faq = pickRelatedByType(entry, entries, ["faq"]);
  const fallbackRelated = relationshipEntries(entry, entries)[0] || null;
  const steps = [];

  if (entry.type === "challenge") {
    steps.push(makeGuidedStep(
      1,
      "先看挑战目标",
      entry,
      "先不要急着做。老师会先带你看这条挑战到底要求完成什么、交付什么，以及它最容易卡在哪里。",
      "这条挑战最后要产出什么？",
      "理解目标后，后面的资料才不会变成零散阅读。",
      "应能说出这条挑战要求的最终交付物是什么（如一份文档、一个可演示的作品或一段代码），而不只是复述标题。"
    ));
    steps.push(makeGuidedStep(
      2,
      "用提示词拆任务",
      prompt || entry,
      prompt
        ? "这一段重点看 Prompt 如何把挑战拆成可执行步骤。你不需要背提示词，而是学会它为什么这样问。"
        : "当前还没有关联 Prompt。先用挑战摘要自己拆出 3 个动作：理解要求、准备材料、形成交付。",
      "这个 Prompt 或拆解方式帮你减少了哪一步的不确定性？",
      "挑战类知识需要从任务说明走向可执行计划。",
      "应指出拆解把某一个模糊环节（如「不知道从哪下手」「不确定要交什么」）变成了明确可执行的一步，而不是泛泛说「有帮助」。"
    ));
    steps.push(makeGuidedStep(
      3,
      "参考项目案例",
      project || fallbackRelated || entry,
      project
        ? "现在看一个项目案例。重点不是照抄，而是看别人如何把挑战要求变成作品。"
        : "当前还没有项目案例关联。你可以先把这条挑战当作案例模板，思考自己会怎么完成。",
      "这个案例最值得你借鉴的一个动作是什么？",
      "案例能把抽象要求变成具体做法。",
      "应具体点出案例里的某一个可操作动作（如「先定义用户再动手」「用某结构组织内容」），而不是笼统说「整体不错」。"
    ));
    steps.push(makeGuidedStep(
      4,
      "提炼可复用方法",
      bestPractice || entry,
      bestPractice
        ? "这一步看最佳实践。老师会帮你把案例里的做法提炼成下次还能用的方法。"
        : "如果还没有最佳实践，就先从当前挑战里提炼一个固定检查清单。",
      "下次遇到类似任务时，你会复用哪条方法？",
      "知识库的价值不是看完，而是能复用。",
      "应提炼出一条可迁移到其他任务的方法或检查清单（如「先列交付标准再动手」），强调它为什么下次还能用。"
    ));
    steps.push(makeGuidedStep(
      5,
      "形成自己的行动",
      entry,
      "最后把这条挑战转成你的下一步行动：你要先读什么、写什么、检查什么。到这一步，浏览就变成了执行准备。",
      "你现在能写出第一步行动吗？",
      "带练的终点是让用户能开始做。",
      "应给出一个具体、可立即执行的第一步（如「先写出目标用户画像」「先搭一个最小可运行demo」），而不是「我再想想」这类空泛回答。"
    ));
  } else if (entry.type === "project") {
    steps.push(makeGuidedStep(
      1,
      "先看项目解决的问题",
      entry,
      "先看项目场景和摘要。老师会带你判断：这个项目到底解决了什么真实问题。",
      "这个项目的核心问题是什么？",
      "项目案例要先看问题，再看结果。",
      "应说清这个项目针对的真实问题或需求是什么（谁遇到了什么困难），而不是只描述项目做了什么功能。"
    ));
    steps.push(makeGuidedStep(
      2,
      "回看挑战来源",
      challenge || fallbackRelated || entry,
      challenge
        ? "现在回到它关联的挑战，看项目是怎么回应挑战要求的。"
        : "当前还没有关联挑战。先根据项目摘要反推它可能回应了什么任务要求。",
      "项目里的哪个部分对应了挑战要求？",
      "项目案例需要和任务要求对齐。",
      "应把项目里的某个具体产出对应到挑战的某条要求上（如「这份分析回应了挑战里的X要求」），体现出两者的对齐关系。"
    ));
    steps.push(makeGuidedStep(
      3,
      "看它用了什么方法",
      bestPractice || prompt || entry,
      bestPractice || prompt
        ? "这一步看它背后的方法或 Prompt。你要抓的是可复用动作，而不是只看结果。"
        : "当前还没有方法或 Prompt 关联。先从项目流程里提炼一个可复用动作。",
      "这个项目最可复用的方法是什么？",
      "把案例变成方法，后续才有复利。",
      "应提炼出一个可迁移到其他项目的具体方法或步骤（如某种拆解方式、某个检查动作），而不是只夸项目做得好。"
    ));
    steps.push(makeGuidedStep(
      4,
      "迁移到自己的项目",
      entry,
      "最后把这个案例迁移到你的任务：替换场景、替换材料、保留结构。这样你就不是看案例，而是在学会复用案例。",
      "如果换成你的项目，你会保留哪个结构？",
      "带练要把理解推到应用。",
      "应指出一个值得保留复用的结构或框架（如「保留问题-方法-验证这个骨架」），并说明换成自己任务时怎么替换内容。"
    ));
  } else if (entry.type === "prompt") {
    steps.push(makeGuidedStep(
      1,
      "拆解 Prompt 结构",
      entry,
      "先看这条 Prompt 的完整结构：角色、目标、输入、输出。老师帮你拆成这四个要素，再逐一理解。",
      "一个完整 Prompt 至少应包含哪四个要素？",
      "Prompt 的结构是理解和复用的基础。核心要素是角色、目标、输入、输出。",
      "至少包含角色、目标、输入、输出这四个要素，少了任何一个都会导致指令不清晰。"
    ));
    steps.push(makeGuidedStep(
      2,
      "找到使用场景",
      challenge || project || fallbackRelated || entry,
      "现在把 Prompt 放回真实挑战或项目里看。老师会带你判断它在整个任务中负责哪一步。",
      "它适合在任务的哪个阶段使用？",
      "提示词必须回到任务场景里才有意义。",
      "需要结合自己的具体任务场景来判断：它最适合放在任务的哪个具体环节中，解决哪一段问题。"
    ));
    steps.push(makeGuidedStep(
      3,
      "试着改写一次",
      entry,
      "最后试着把 Prompt 改成你的版本：保留角色、目标、输入、输出要求，替换成你的具体任务。",
      "你会替换哪一段来适配自己的任务？",
      "会改写，才算真正掌握。",
      "把角色、目标、输入、输出四个要素替换成自己任务的具体内容，保留结构不变。"
    ));
  } else {
    steps.push(makeGuidedStep(
      1,
      "先理解这条知识的用途",
      entry,
      "先用一句话说清楚这条知识是干什么的、适合谁用。老师会先帮你建立整体判断。",
      "这条知识最适合在哪个场景使用？",
      "先判断用途，再决定是否深入。",
      "结合你当前的具体场景来判断——关键是这条知识能不能解决你正面临的问题。"
    ));
    steps.push(makeGuidedStep(
      2,
      "查看关联知识",
      fallbackRelated || entry,
      fallbackRelated
        ? "现在看它关联的知识。重点是理解两条知识之间为什么有连接。"
        : "当前还没有显式关联。你可以先从关键词里判断它可能连接哪些知识。",
      "它和当前知识之间是什么关系？",
      "关系能帮助用户从单点知识走向结构化理解。",
      "两条知识之间可能存在概念递进、方法补充或应用场景区别等关系。"
    ));
    steps.push(makeGuidedStep(
      3,
      "形成复用动作",
      entry,
      "最后把这条知识变成一个动作：下次遇到类似问题，你会怎么用它。",
      "你会怎样把它用到自己的任务里？",
      "带练的目标是掌握和复用。",
      "把它变成具体的行动计划：下次遇到类似问题，先用它试一遍，看效果再调整。"
    ));
  }

  const settings = llmSettings();
  const readingMap = buildReadingMap(entry);
  const fieldMappings = buildGuidedFieldMappings(entry, readingMap);
  return {
    entry: compactKnowledgeEntry(entry),
    goal: `在老师带练下快速理解并复用「${entry.title}」${entry.type === "challenge" ? "这条挑战" : "这条知识"}`,
    mode: "rule-template",
    readingMap,
    fieldMappings,
    llmReady: settings.enabled,
    llmNote: settings.enabled
      ? "当前已配置 LLM，后续可以把 teacherScript 升级为模型生成。"
      : "当前未配置 LLM，先使用规则模板带练；后续提供 API Key 后可升级为模型讲解。",
    steps: steps.map((step, index) => ({
      ...step,
      order: index + 1,
      actionLabel: index === steps.length - 1 ? "完成带练" : step.actionLabel
    }))
  };
}

function guidedEntryContext(entry) {
  return {
    id: entry.id,
    title: entry.title,
    type: entry.type,
    summary: entry.summary || "",
    keywords: normalizeArray(entry.keywords).slice(0, 8),
    concepts: normalizeArray(entry.concepts).slice(0, 8),
    skills: normalizeArray(entry.skills).slice(0, 8),
    deliverables: normalizeArray(entry.deliverables).slice(0, 8)
  };
}

function guidedText(value, fallback, limit = 360) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return (text || fallback).slice(0, limit);
}

async function buildGuidedPathWithLlm(entry, db) {
  const rulePath = buildGuidedPath(entry, db);
  const settings = llmSettings();
  if (!settings.enabled) return rulePath;

  const entries = visibleEntries(db.entries, false);
  const byId = new Map(entries.map((item) => [item.id, item]));
  const related = relationshipEntries(entry, entries).slice(0, 6);
  const context = {
    current: guidedEntryContext(entry),
    related: related.map(guidedEntryContext),
    ruleDraft: rulePath.steps.map((step) => ({
      title: step.title,
      entryId: step.entry && step.entry.id,
      reason: step.reason
    }))
  };

  const prompt = [
    "你是 NSEAP 知识库里的老师带练助手。",
    "请根据当前知识和关联知识，生成一条真正像老师带练的学习路径。",
    "要求：用中文，语气具体，不要泛泛讲功能；每一步都要告诉学生看什么、为什么看、检查什么。",
    "只返回 JSON，不要返回 Markdown。",
    "JSON 结构：",
    "{\"goal\":\"...\",\"steps\":[{\"title\":\"...\",\"entryId\":\"可选，优先使用给定 id\",\"teacherScript\":\"...\",\"checkQuestion\":\"...\",\"referenceAnswer\":\"...\",\"reason\":\"...\"}]}",
    "steps 建议 3 到 5 步。",
    "",
    "知识上下文：",
    JSON.stringify(context, null, 2)
  ].join("\n");

  try {
    const response = await fetchWithTimeout(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.35,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: "你负责把知识库条目转成老师带练路径，输出必须是严格 JSON。"
          },
          { role: "user", content: prompt }
        ]
      })
    }, 45000);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `LLM request failed: ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content) || {};
    let rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
    if (!rawSteps.length && String(content || "").trim()) {
      rawSteps = [{
        title: "模型生成讲解",
        teacherScript: String(content).trim(),
        checkQuestion: "这段讲解里最关键的行动是什么？",
        reason: "模型返回了文本讲解，系统已转成带练步骤。"
      }];
    }
    const limitedSteps = rawSteps.slice(0, 6);
    const steps = limitedSteps.map((raw, index) => {
      const fallbackStep = rulePath.steps[index] || rulePath.steps[rulePath.steps.length - 1] || {};
      const targetEntry = byId.get(String(raw.entryId || "")) || byId.get(fallbackStep.entry && fallbackStep.entry.id) || entry;
      return {
        order: index + 1,
        title: guidedText(raw.title, fallbackStep.title || `第 ${index + 1} 步`, 80),
        entry: compactKnowledgeEntry(targetEntry),
        teacherScript: guidedText(raw.teacherScript, fallbackStep.teacherScript || "先理解这条知识的使用场景，再判断它能帮你解决什么问题。"),
        checkQuestion: guidedText(raw.checkQuestion, fallbackStep.checkQuestion || "你能用一句话说清这一步的重点吗？", 160),
        referenceAnswer: guidedText(raw.referenceAnswer, fallbackStep.referenceAnswer || raw.checkQuestion || "参考答案待补充", 300),
        reason: guidedText(raw.reason, fallbackStep.reason || "由模型根据知识关系生成。", 180),
        actionLabel: index === limitedSteps.length - 1 ? "完成带练" : "我懂了，下一步"
      };
    }).filter((step) => step.teacherScript && step.checkQuestion);

    if (!steps.length) throw new Error("LLM response did not include valid steps");

    return {
      ...rulePath,
      goal: guidedText(parsed.goal, rulePath.goal, 180),
      mode: "llm-generated",
      llmReady: true,
      llmNote: `已使用 ${settings.model} 生成老师带练。`,
      steps
    };
  } catch (error) {
    return {
      ...rulePath,
      llmReady: true,
      llmNote: `LLM 带练生成失败，已回退规则模板：${error.message || "unknown error"}`
    };
  }
}

function sanitizeEntry(raw) {
  const title = String(raw.title || "").trim();
  const type = normalizeKnowledgeType(raw.type, "project");
  if (!title) {
    const error = new Error("title is required");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const id = String(raw.id || `kb-${type}-${Date.now()}`).trim();
  const keywords = normalizeArray(raw.keywords);
  const tags = normalizeArray(raw.tags);
  const concepts = normalizeArray(raw.concepts);
  const skills = normalizeArray(raw.skills);
  const deliverables = normalizeArray(raw.deliverables);
  const audience = normalizeArray(raw.audience);
  const relationships = normalizeRelationships(raw.relationships, []);
  const knowledgeProcessing = normalizeKnowledgeProcessing(raw.knowledgeProcessing);

  return {
    id,
    title,
    type,
    status: normalizeStatus(raw.status),
    audience,
    tags,
    keywords,
    concepts,
    skills,
    deliverables,
    related: normalizeArray(raw.related),
    relationships,
    summary: String(raw.summary || ""),
    agentNotes: String(raw.agentNotes || ""),
    situation: String(raw.situation || ""),
    ontology: String(raw.ontology || ""),
    workflow: String(raw.workflow || ""),
    skill: String(raw.skill || ""),
    evaluation: String(raw.evaluation || ""),
    knowledgeGrowth: String(raw.knowledgeGrowth || ""),
    knowledgeProcessing,
    source: String(raw.source || "api-created"),
    searchText: [
      title,
      type,
      ...audience,
      ...tags,
      ...keywords,
      ...concepts,
      ...skills,
      ...deliverables,
      raw.summary,
      raw.agentNotes,
      raw.situation,
      raw.ontology,
      raw.workflow,
      knowledgeProcessing.classificationReason,
      knowledgeProcessing.coreProblem,
      ...knowledgeProcessing.keyPoints,
      ...knowledgeProcessing.missingFields,
      ...knowledgeProcessing.nextActions,
      raw.searchText
    ].filter(Boolean).join(" "),
    metadataGeneratedBy: String(raw.metadataGeneratedBy || "manual"),
    analysisStatus: String(raw.analysisStatus || ""),
    analysisNote: String(raw.analysisNote || ""),
    analysisConfidence: typeof raw.analysisConfidence === "number" ? raw.analysisConfidence : null,
    extractionStatus: String(raw.extractionStatus || ""),
    extractionMethod: String(raw.extractionMethod || ""),
    extractionNote: String(raw.extractionNote || ""),
    extractedText: String(raw.extractedText || ""),
    chunks: Array.isArray(raw.chunks) ? raw.chunks : [],
    extractedTextPreview: String(raw.extractedTextPreview || ""),
    archivedAt: raw.archivedAt || null,
    createdAt: raw.createdAt || now,
    updatedAt: now
  };
}

function buildSearchText(entry) {
  return [
    entry.id,
    entry.title,
    entry.type,
    entry.status,
    ...normalizeArray(entry.audience),
    ...normalizeArray(entry.tags),
    ...normalizeArray(entry.keywords),
    ...normalizeArray(entry.concepts),
    ...normalizeArray(entry.skills),
    ...normalizeArray(entry.deliverables),
    ...normalizeArray(entry.related),
    entry.summary,
    entry.situation,
    entry.ontology,
    entry.workflow,
    entry.skill,
    entry.evaluation,
    entry.knowledgeGrowth,
    entry.knowledgeProcessing && entry.knowledgeProcessing.classificationReason,
    entry.knowledgeProcessing && entry.knowledgeProcessing.coreProblem,
    ...(entry.knowledgeProcessing ? normalizeArray(entry.knowledgeProcessing.keyPoints) : []),
    ...(entry.knowledgeProcessing ? normalizeArray(entry.knowledgeProcessing.missingFields) : []),
    ...(entry.knowledgeProcessing ? normalizeArray(entry.knowledgeProcessing.nextActions) : []),
    entry.source,
    entry.metadataGeneratedBy,
    entry.analysisStatus,
    entry.analysisNote,
    entry.extractionStatus,
    entry.extractionNote,
    entry.extractedTextPreview
  ].filter(Boolean).join(" ");
}

function safeFileName(fileName) {
  const baseName = path.basename(String(fileName || "upload.txt"));
  const cleaned = baseName.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 90);
  return cleaned || "upload.txt";
}

function titleFromFileName(fileName) {
  return path.basename(String(fileName || "上传文件"), path.extname(String(fileName || "")))
    .replace(/[_-]+/g, " ")
    .trim() || "上传文件";
}

function inferKnowledgeType(fileName, text) {
  const value = `${fileName || ""} ${text || ""}`.toLowerCase();
  if (value.includes("challenge") || value.includes("挑战")) return "challenge";
  if (value.includes("prompt") || value.includes("提示词")) return "prompt";
  if (value.includes("faq") || value.includes("问答")) return "faq";
  if (value.includes("course") || value.includes("week") || value.includes("课程")) return "course";
  if (value.includes("practice") || value.includes("最佳实践")) return "best-practice";
  if (value.includes("agent")) return "agent";
  return "project";
}

function cleanBaseUrl(value, fallback = defaultLlmBaseUrl) {
  const text = String(value || "").trim();
  return (text || fallback).replace(/\/+$/, "");
}

function llmSettings() {
  const config = readRuntimeConfig();
  const runtime = config.llm && typeof config.llm === "object" ? config.llm : {};
  const envApiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
  const runtimeApiKey = typeof runtime.apiKey === "string" ? runtime.apiKey.trim() : "";
  const apiKey = runtimeApiKey || envApiKey || "";
  const baseUrl = cleanBaseUrl(
    runtime.baseUrl,
    process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || defaultLlmBaseUrl
  );
  const model = String(runtime.model || process.env.LLM_MODEL || process.env.OPENAI_MODEL || defaultLlmModel).trim() || defaultLlmModel;

  return {
    enabled: Boolean(apiKey),
    apiKey,
    baseUrl,
    model,
    apiKeySource: runtimeApiKey ? "runtime" : (envApiKey ? "env" : "none")
  };
}

function publicSettings() {
  const settings = llmSettings();
  return {
    llm: {
      enabled: settings.enabled,
      apiKeyConfigured: settings.enabled,
      apiKeySource: settings.apiKeySource,
      baseUrl: settings.baseUrl,
      model: settings.model
    }
  };
}

function updateRuntimeSettings(payload) {
  const config = readRuntimeConfig();
  const next = {
    ...config,
    llm: {
      ...(config.llm && typeof config.llm === "object" ? config.llm : {})
    }
  };

  const llm = payload && typeof payload.llm === "object" ? payload.llm : {};
  if (Object.prototype.hasOwnProperty.call(llm, "baseUrl")) {
    next.llm.baseUrl = cleanBaseUrl(llm.baseUrl);
  }
  if (Object.prototype.hasOwnProperty.call(llm, "model")) {
    next.llm.model = String(llm.model || "").trim() || defaultLlmModel;
  }
  if (Object.prototype.hasOwnProperty.call(llm, "apiKey")) {
    const apiKey = String(llm.apiKey || "").trim();
    if (apiKey) next.llm.apiKey = apiKey;
  }
  if (llm.clearApiKey === true) {
    delete next.llm.apiKey;
  }

  writeRuntimeConfig(next);
  return publicSettings();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

// 把上传分析返回的 suggestedRelations 拼成 agentNotes 的“联动”尾句。
// 模型不知道库里其他条目的真实 ID，所以联动只给“方向 + 提示”，由人后续替换成真实 id。
function appendRelationHintToAgentNotes(agentNotes, suggestedRelations) {
  const base = String(agentNotes || "").trim();
  const rels = Array.isArray(suggestedRelations) ? suggestedRelations : [];
  const predicateLabel = {
    includes: "包含", requires: "需要", supports: "支持",
    assessedBy: "被评估", usesPrompt: "用到提示词", relatedTo: "相关", usesPractice: "用到实践"
  };
  const hints = rels
    .map((r) => {
      const p = predicateLabel[r && r.predicate] || (r && r.predicate) || "相关";
      const target = String((r && (r.targetHint || r.target)) || "").trim();
      return target ? `${p} → ${target}` : "";
    })
    .filter(Boolean)
    .slice(0, 3);
  if (!base) return "";
  if (hints.length === 0) return base;
  const sep = /[；;。]$/.test(base) ? "" : "；";
  return `${base}${sep}联动：${hints.join("、")}（待人工替换为具体条目）。`;
}

function normalizeLlmAnalysis(value) {
  const data = value && typeof value === "object" ? value : {};
  const type = normalizeKnowledgeType(data.type, "project");
  return {
    title: String(data.title || "").trim(),
    type,
    summary: String(data.summary || "").trim(),
    agentNotes: String(data.agentNotes || data.agent_notes || "").trim(),
    audience: normalizeArray(data.audience),
    tags: normalizeArray(data.tags),
    keywords: normalizeArray(data.keywords),
    concepts: normalizeArray(data.concepts),
    skills: normalizeArray(data.skills),
    deliverables: normalizeArray(data.deliverables),
    knowledgeProcessing: normalizeKnowledgeProcessing(data.knowledgeProcessing || data.processing || data.knowledge_processing),
    situation: String(data.situation || "").trim(),
    ontology: String(data.ontology || "").trim(),
    workflow: String(data.workflow || "").trim(),
    skill: String(data.skill || "").trim(),
    evaluation: String(data.evaluation || "").trim(),
    knowledgeGrowth: String(data.knowledgeGrowth || "").trim(),
    confidence: Number.isFinite(Number(data.confidence)) ? Math.max(0, Math.min(1, Number(data.confidence))) : null
  };
}

function ruleAnalysis(payload) {
  const fileName = payload.fileName || "";
  const text = payload.text || "";
  const title = titleFromFileName(fileName);
  const type = inferKnowledgeType(fileName, text);
  const textPreview = extractTextPreview(text);
  const extension = path.extname(String(fileName || "")).replace(".", "");

  return {
    title,
    type,
    summary: textPreview || `由上传文件 ${fileName || "未命名文件"} 自动生成的知识草稿，后续需要补充 metadata。`,
    agentNotes: `触发条件：用户问到「${title}」相关内容时可参考（待完善）；能力范围：提供该资料的原始内容，具体可回答范围待整理；限制：这是未经 LLM 分析的自动草稿桩，正文和边界尚未确认，正式使用前需人工补写或配置 LLM 后重新生成。`,
    audience: ["Builder", "Agent"],
    tags: ["uploaded-file", extension || "file"].filter(Boolean),
    keywords: [title, fileName, extension, "上传文件", "知识草稿"].filter(Boolean),
    concepts: [],
    skills: [],
    deliverables: [],
    knowledgeProcessing: {
      classificationReason: `系统根据文件名、正文关键词和资料用途，初步归类为“${typeMeta[type] || type}”。`,
      coreProblem: textPreview || "这份资料需要先从原始文件变成可检索、可理解、可复用的知识草稿。",
      keyPoints: uniqueStrings([title, fileName, typeMeta[type] || type, extension].filter(Boolean)).slice(0, 5),
      suggestedRelations: [
        {
          predicate: "relatedTo",
          targetHint: "已有课程、挑战、项目案例或提示词",
          reason: "上传后需要人工检查它和现有知识库中哪些条目有关。"
        }
      ],
      missingFields: ["分类理由需要人工确认", "相关知识关系需要补充", "适用对象和复用场景需要检查"],
      nextActions: ["检查分类是否正确", "补充关键词、概念和技能", "关联已有知识", "通过老师带练验证是否好理解"]
    },
    situation: "用于把学生、老师或 Builder 提交的原始资料先纳入知识库，形成可继续整理的草稿。",
    ontology: "原始文件 -> 知识草稿 -> metadata 标注 -> 审核 -> 正式知识条目。",
    workflow: "上传文件 -> 后端保存文件 -> 自动生成 draft 条目 -> 人工补充分类、关键词、概念和关系 -> 审核发布。",
    skill: "资料归档、metadata 标注、知识整理、审核发布。",
    evaluation: "文件是否保存成功，草稿是否能被搜索到，后续 metadata 是否补充完整。",
    knowledgeGrowth: "上传资料经过整理和审核后，可以沉淀为课程、挑战、项目案例、FAQ、最佳实践或 Agent 上下文。",
    confidence: 0.25
  };
}

async function analyzeUploadWithLlm(payload) {
  const settings = llmSettings();
  const text = String(payload.text || "").trim().slice(0, 8000);
  const fallback = ruleAnalysis(payload);

  if (!text) {
    return {
      ...fallback,
      metadataGeneratedBy: "rule",
      analysisStatus: "needs-text-extraction",
      analysisNote: "当前文件没有可读取正文，通常是 docx/pdf 等二进制文件；已先按文件名生成草稿，后续可补充 metadata。"
    };
  }

  if (!settings.enabled) {
    return {
      ...fallback,
      metadataGeneratedBy: "rule",
      analysisStatus: "llm-disabled",
      analysisNote: "未配置 LLM_API_KEY，已使用规则兜底生成草稿；配置 Key 后上传会自动调用 LLM 分类。"
    };
  }

  const prompt = [
    "你是 NSEAP Knowledge Cognitive Cell 的知识整理助手。",
    "请根据上传文件正文，生成一个知识草稿的 metadata。",
    "只能返回 JSON，不要返回 Markdown。",
    "type 必须是 overview/course/challenge/prompt/faq/best-practice/project/agent/rubric 之一。",
    "audience、tags、keywords、concepts、skills、deliverables 必须是数组。",
    "summary 用中文，一句话说明资料解决什么问题。",
    "必须返回 agentNotes 字符串：写给其他 AI Agent 看的“使用说明”，用中文，必须严格包含三段，用分号分隔——",
    "“触发条件：（用户问什么/什么场景时应检索这条）；能力范围：（这条能用来回答或支撑什么）；限制：（不能用于什么、有什么边界）”。不要写联动关系，系统会用 suggestedRelations 自动补。",
    "必须返回 knowledgeProcessing 对象，用来解释系统如何把原始文件加工成知识单元。",
    "knowledgeProcessing 结构必须包含：classificationReason 字符串、coreProblem 字符串、keyPoints 数组、suggestedRelations 数组、missingFields 数组、nextActions 数组。",
    "suggestedRelations 数组里的每一项包含 predicate、targetHint、reason。predicate 优先使用 includes/requires/supports/assessedBy/usesPrompt/relatedTo/usesPractice。",
    "nextActions 要写成用户能马上执行的动作，例如检查分类、补充关联、开始带练、发布审核。",
    "confidence 是 0 到 1 的数字。",
    "",
    `文件名：${payload.fileName || "未命名文件"}`,
    "文件正文：",
    text
  ].join("\n");

  try {
    const response = await fetchWithTimeout(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: "你负责把课程、挑战、项目案例、FAQ、最佳实践和 Agent 上下文整理成结构化知识 metadata。"
          },
          { role: "user", content: prompt }
        ]
      })
    }, 45000);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `LLM request failed: ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content);
    const analysis = normalizeLlmAnalysis(parsed);
    const merged = {
      ...fallback,
      ...Object.fromEntries(Object.entries(analysis).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== "" && value !== null;
      }))
    };

    // 联动部分不让模型猜（它不知道其他条目 ID，容易幻觉），改用同次返回的 suggestedRelations 拼接。
    merged.agentNotes = appendRelationHintToAgentNotes(
      merged.agentNotes,
      merged.knowledgeProcessing && merged.knowledgeProcessing.suggestedRelations
    );

    return {
      ...merged,
      metadataGeneratedBy: "llm",
      analysisStatus: "llm-analyzed",
      analysisNote: `已使用 ${settings.model} 自动分析正文并生成 metadata。`,
      confidence: analysis.confidence ?? 0.7
    };
  } catch (error) {
    return {
      ...fallback,
      metadataGeneratedBy: "rule",
      analysisStatus: "llm-failed",
      analysisNote: `LLM 分析失败，已使用规则兜底生成草稿：${error.message || "unknown error"}`
    };
  }
}

function extractTextPreview(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function decodeXmlEntities(text) {
  return String(text || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function findZipEntry(buffer, wantedName) {
  const minOffset = Math.max(0, buffer.length - 66000);
  let endOffset = -1;
  for (let i = buffer.length - 22; i >= minOffset; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      endOffset = i;
      break;
    }
  }
  if (endOffset === -1) return null;

  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const centralOffset = buffer.readUInt32LE(endOffset + 16);
  let offset = centralOffset;

  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) return null;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength).replace(/\\/g, "/");

    if (name === wantedName) {
      if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) return null;
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      return null;
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return null;
}

function extractDocxText(buffer) {
  const documentXml = findZipEntry(buffer, "word/document.xml");
  if (!documentXml) return "";
  const xml = documentXml.toString("utf8")
    .replace(/<w:tab\b[^>]*\/>/g, " ")
    .replace(/<w:br\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n");
  const parts = [];
  for (const match of xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)) {
    parts.push(decodeXmlEntities(match[1]));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function decodePdfLiteral(value) {
  return String(value || "")
    .replace(/\\([nrtbf()\\])/g, (_, char) => ({
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\"
    }[char] || char))
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function extractPdfText(buffer) {
  const source = buffer.toString("utf8");
  const parts = [];
  for (const match of source.matchAll(/\(((?:\\.|[^\\()])*)\)\s*(?:Tj|'|")/g)) {
    parts.push(decodePdfLiteral(match[1]));
  }
  for (const match of source.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
    for (const inner of match[1].matchAll(/\(((?:\\.|[^\\()])*)\)/g)) {
      parts.push(decodePdfLiteral(inner[1]));
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function extractUploadText(payload, binary) {
  const fileName = String(payload.fileName || "");
  const fileType = String(payload.fileType || "");
  const extension = path.extname(fileName).toLowerCase();
  const directText = String(payload.text || "").trim();

  if (directText) {
    return {
      text: directText,
      status: "text-extracted",
      method: "browser-text",
      note: "已直接读取文本文件正文。"
    };
  }

  if (!binary) {
    return {
      text: "",
      status: "needs-text-extraction",
      method: "none",
      note: "当前上传内容没有可读取正文。"
    };
  }

  try {
    if (extension === ".docx" || fileType.includes("wordprocessingml")) {
      const text = extractDocxText(binary);
      return {
        text,
        status: text ? "text-extracted" : "needs-text-extraction",
        method: "docx-xml",
        note: text ? "已从 Word 文档抽取正文。" : "Word 文档中没有抽取到正文。"
      };
    }

    if (extension === ".pdf" || fileType.includes("pdf")) {
      const text = extractPdfText(binary);
      return {
        text,
        status: text ? "text-extracted" : "needs-text-extraction",
        method: "pdf-text-stream",
        note: text ? "已从 PDF 文本流抽取正文。" : "PDF 可能是扫描件或复杂编码，当前未抽取到正文。"
      };
    }
  } catch (error) {
    return {
      text: "",
      status: "needs-text-extraction",
      method: extension.replace(".", "") || "binary",
      note: `正文抽取失败：${error.message || "unknown error"}`
    };
  }

  return {
    text: "",
    status: "needs-text-extraction",
    method: extension.replace(".", "") || "binary",
    note: "当前文件类型暂未支持自动正文抽取。"
  };
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:.*?;base64,(.+)$/);
  return match ? Buffer.from(match[1], "base64") : null;
}

function buildUploadEntry(payload, storedName, relativeSource, analysis, extraction) {
  const inferred = analysis || ruleAnalysis(payload);
  const title = String(payload.title || inferred.title || titleFromFileName(payload.fileName)).trim();
  const textPreview = extractTextPreview(payload.text);
  const type = normalizeKnowledgeType(payload.type || inferred.type || inferKnowledgeType(payload.fileName, payload.text));
  const extension = path.extname(String(payload.fileName || "")).replace(".", "");
  const keywords = uniqueStrings([...normalizeArray(payload.keywords), ...normalizeArray(inferred.keywords)]);
  const now = new Date().toISOString();

  return sanitizeEntry({
    id: `kb-upload-${Date.now()}`,
    title,
    type,
    status: "draft",
    audience: uniqueStrings([...normalizeArray(inferred.audience), "Builder", "Agent"]),
    tags: uniqueStrings(["uploaded-file", extension || "file", ...normalizeArray(inferred.tags)]),
    keywords: uniqueStrings([title, payload.fileName, extension, "上传文件", "知识草稿", ...keywords]),
    concepts: normalizeArray(inferred.concepts),
    skills: normalizeArray(inferred.skills),
    deliverables: normalizeArray(inferred.deliverables),
    related: [],
    relationships: [],
    summary: inferred.summary || textPreview || `由上传文件 ${payload.fileName || storedName} 自动生成的知识草稿，后续需要补充 metadata。`,
    agentNotes: inferred.agentNotes || "",
    situation: inferred.situation,
    ontology: inferred.ontology,
    workflow: inferred.workflow,
    skill: inferred.skill,
    evaluation: inferred.evaluation,
    knowledgeGrowth: inferred.knowledgeGrowth,
    knowledgeProcessing: inferred.knowledgeProcessing,
    source: relativeSource,
    searchText: `${title} ${payload.fileName || ""} 上传文件 知识草稿 ${textPreview}`,
    metadataGeneratedBy: inferred.metadataGeneratedBy || "rule",
    analysisStatus: inferred.analysisStatus || "rule-fallback",
    analysisNote: inferred.analysisNote || "已使用规则生成草稿。",
    analysisConfidence: inferred.confidence,
    extractedText: extraction ? (extraction.text || "") : "",
    chunks: extraction && extraction.text ? chunkText(extraction.text) : [],
    extractionStatus: extraction ? extraction.status : "",
    extractionMethod: extraction ? extraction.method : "",
    extractionNote: extraction ? extraction.note : "",
    extractedTextPreview: textPreview,
    createdAt: now,
    updatedAt: now
  });
}

function setUploadProgress(onProgress, progress, phase, detail) {
  if (typeof onProgress === "function") onProgress({ progress, phase, detail });
}

async function createUploadDraft(payload, onProgress) {
  const db = readDb();
  const fileName = safeFileName(payload.fileName);
  const storedName = `${Date.now()}-${fileName}`;
  const targetPath = path.resolve(uploadDir, storedName);

  if (!targetPath.startsWith(uploadDir)) {
    const error = new Error("Invalid file name");
    error.statusCode = 400;
    throw error;
  }

  setUploadProgress(onProgress, 62, "saving", "正在保存原始文件");
  fs.mkdirSync(uploadDir, { recursive: true });

  const binary = decodeDataUrl(payload.dataUrl);
  if (binary) fs.writeFileSync(targetPath, binary);
  else fs.writeFileSync(targetPath, String(payload.text || ""), "utf8");

  setUploadProgress(onProgress, 70, "extracting", "正在抽取正文");
  const source = `/uploads/${encodeURIComponent(storedName)}`;
  const extraction = extractUploadText(payload, binary);
  const analysisPayload = {
    ...payload,
    text: extraction.text || payload.text || ""
  };

  setUploadProgress(onProgress, 78, "analyzing", llmSettings().enabled ? "正在调用 LLM 分析分类" : "正在使用规则生成草稿");
  const analysis = await analyzeUploadWithLlm(analysisPayload);

  setUploadProgress(onProgress, 94, "indexing", "正在写入知识库");
  const entry = buildUploadEntry(analysisPayload, storedName, source, analysis, extraction);
  db.entries.push(entry);
  writeDb(db);

  return {
    file: {
      originalName: payload.fileName || fileName,
      storedName,
      source,
      size: Number(payload.fileSize || 0)
    },
    entry
  };
}

function publicUploadJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    phase: job.phase,
    detail: job.detail,
    result: job.result || null,
    error: job.error || null
  };
}

function updateUploadJob(job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
}

function scheduleUploadJobCleanup(jobId) {
  setTimeout(() => uploadJobs.delete(jobId), 10 * 60 * 1000).unref?.();
}

async function runUploadJob(job, payload) {
  try {
    updateUploadJob(job, {
      status: "processing",
      progress: 58,
      phase: "queued",
      detail: "后端已收到文件，准备处理"
    });
    const result = await createUploadDraft(payload, (state) => updateUploadJob(job, state));
    updateUploadJob(job, {
      status: "completed",
      progress: 100,
      phase: "completed",
      detail: "已完成入库",
      result
    });
  } catch (error) {
    updateUploadJob(job, {
      status: "failed",
      progress: Math.max(1, job.progress || 1),
      phase: "failed",
      detail: "上传处理失败",
      error: error.message || "上传失败"
    });
  } finally {
    scheduleUploadJobCleanup(job.id);
  }
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon"
  }[ext] || "application/octet-stream";
}

function serveUpload(req, res, pathname) {
  const relative = decodeURIComponent(pathname.replace(/^\/uploads\/?/, ""));
  const candidate = path.resolve(uploadDir, relative);
  if (!candidate.startsWith(uploadDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(candidate, (error, content) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(candidate) });
    res.end(content);
  });
}

function serveStatic(req, res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const candidate = path.resolve(appDir, `.${decodeURIComponent(cleanPath)}`);
  if (!candidate.startsWith(appDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(candidate, (error, content) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(candidate) });
    res.end(content);
  });
}

async function handleApi(req, res, url) {
  const db = readDb();

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      service: "nseap-knowledge-base",
      entries: db.entries.length,
      llmEnabled: llmSettings().enabled
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/llm/status") {
    const settings = llmSettings();
    sendJson(res, 200, {
      enabled: settings.enabled,
      apiKeyConfigured: settings.enabled,
      apiKeySource: settings.apiKeySource,
      model: settings.enabled ? settings.model : null,
      baseUrl: settings.enabled ? settings.baseUrl : null,
      note: settings.enabled
        ? "LLM metadata analysis is enabled."
        : "LLM_API_KEY or OPENAI_API_KEY is not configured; upload uses rule fallback."
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/settings") {
    sendJson(res, 200, publicSettings());
    return;
  }

  if ((req.method === "PATCH" || req.method === "POST") && url.pathname === "/api/settings") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    sendJson(res, 200, updateRuntimeSettings(payload));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/knowledge") {
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    sendJson(res, 200, {
      ...db,
      entries: visibleEntries(db.entries, includeArchived)
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/search") {
    const query = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || "all";
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const results = searchEntries(db.entries, query, category, { includeArchived });
    sendJson(res, 200, {
      query,
      category,
      includeArchived,
      count: results.length,
      results: results.slice(0, 50).map(({ entry, matchedFields, score, snippet }) => ({ ...entry, matchedFields, score, snippet }))
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/agent/context") {
    const query = url.searchParams.get("q") || "";
    const role = url.searchParams.get("role") || "";
    const type = url.searchParams.get("type") || "all";
    const limit = url.searchParams.get("limit") || 8;
    const context = buildAgentContext(db.entries, { query, role, type, limit });
    sendJson(res, 200, {
      query,
      role: role || null,
      type,
      count: context.length,
      generatedAt: new Date().toISOString(),
      note: "Agent 检索上下文（V0.3 预留基础版）：按可信状态与相关性排序，含出处与显式关系。",
      context
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/search/deep") {
    const rawBody = await readRequestBody(req);
    const body = rawBody ? parseJsonObject(rawBody) : {};
    const query = String(body.query || "").trim();
    if (!query) { sendJson(res, 400, { error: "缺少 query 字段" }); return; }
    const category = String(body.category || "all");
    const keywordResults = searchEntries(db.entries, query, category);
    const inputEntries = keywordResults.slice(0, 20).map(r => r.entry);
    if (inputEntries.length === 0) {
      sendJson(res, 200, { query, count: 0, results: [] });
      return;
    }
    const settings = llmSettings();
    if (!settings.enabled) {
      sendJson(res, 200, {
        query, count: keywordResults.length,
        results: keywordResults.slice(0, 10).map(({ entry, matchedFields, score, snippet }) => ({ ...entry, matchedFields, score, snippet }))
      });
      return;
    }
    const prompt = [
      "你是一个知识库搜索排序专家。根据用户的搜索意图，对候选知识条目重新排序。",
      "按语义相关性从高到低排列，只保留最相关的 10 条。",
      "输出 JSON 数组：每个元素包含 id（条目 id）和 reason（为什么相关，一句话，10 字内）。",
      "",
      "搜索查询：" + query,
      "候选条目列表：",
      JSON.stringify(inputEntries.map(e => ({ id: e.id, title: e.title, summary: (e.summary || "").slice(0, 120), keywords: (e.keywords || []).slice(0, 5) })), null, 2)
    ].join("\n");
    try {
      const response = await fetchWithTimeout(`${settings.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}` },
        body: JSON.stringify({
          model: settings.model,
          temperature: 0.15,
          max_tokens: 1200,
          messages: [
            { role: "system", content: "你是一个搜索排序助手。只返回 JSON 数组。" },
            { role: "user", content: prompt }
          ]
        })
      }, 20000);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `LLM request failed: ${response.status}`);
      const content = data.choices?.[0]?.message?.content || "";
      const ranked = parseJsonObject(content);
      if (!Array.isArray(ranked)) throw new Error("LLM did not return an array");
      const byId = new Map(inputEntries.map(e => [e.id, e]));
      const deepResults = ranked.map(r => byId.get(r.id)).filter(Boolean).slice(0, 10);
      sendJson(res, 200, {
        query, count: deepResults.length, deep: true,
        results: deepResults.map(e => {
          const kw = keywordResults.find(kr => kr.entry.id === e.id);
          return { ...e, score: kw ? kw.score : 0, snippet: kw ? kw.snippet : "", matchedFields: kw ? kw.matchedFields : [] };
        })
      });
    } catch (error) {
      console.error("Deep search error:", error.message);
      const fallback = keywordResults.slice(0, 10).map(({ entry, matchedFields, score, snippet }) => ({ ...entry, matchedFields, score, snippet }));
      sendJson(res, 200, { query, count: fallback.length, deep: false, note: "语义排序暂不可用，使用关键词排序结果。", results: fallback });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/knowledge-graph") {
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    sendJson(res, 200, buildKnowledgeGraph(db, { includeArchived }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/guided-path") {
    const entryId = url.searchParams.get("entryId") || "";
    const entry = db.entries.find((item) => item.id === entryId);
    if (!entry || isArchivedEntry(entry)) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }

    sendJson(res, 200, await buildGuidedPathWithLlm(entry, db));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/guided/check-answer") {
    const rawBody = await readRequestBody(req);
    const body = rawBody ? parseJsonObject(rawBody) : {};
    const { question, studentAnswer, referenceAnswer } = body || {};
    if (!question || !studentAnswer || !referenceAnswer) {
      sendJson(res, 400, { error: "缺少必要字段（question/studentAnswer/referenceAnswer）" });
      return;
    }
    const settings = llmSettings();
    if (!settings.enabled) {
      // 无 LLM 时用关键词重合度粗判：从参考答案里抽取有意义的词，看学生回答覆盖了多少。
      // 这比纯看字数更能反映理解，但仍是启发式，明确告知用户。
      const gradeResult = gradeAnswerByKeywordOverlap(studentAnswer, referenceAnswer);
      sendJson(res, 200, gradeResult);
      return;
    }
    const prompt = [
      "你是一个严格的带练助教，检查学生对知识点的理解。",
      "下面是有参考答案和小检查问题。请判断学生的理解是否到位。",
      "",
      "问题：" + question,
      "参考答案：" + referenceAnswer,
      "学生回答：" + studentAnswer,
      "",
      "输出严格 JSON，不要 Markdown：",
      JSON.stringify({ correct: "true/false/partial", score: "0.0~1.0 的数字", feedback: "针对学生回答的简短反馈，指出哪里对、哪里可以补充", summary: "一句话概括学生理解是否正确" })
    ].join("\n");
    try {
      const response = await fetchWithTimeout(`${settings.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}` },
        body: JSON.stringify({
          model: settings.model,
          temperature: 0.2,
          max_tokens: 400,
          messages: [
            { role: "system", content: "你是一个严格但友好的带练助教。根据参考答案评判学生理解。" },
            { role: "user", content: prompt }
          ]
        })
      }, 15000);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `LLM request failed: ${response.status}`);
      const content = data.choices?.[0]?.message?.content || "";
      const parsed = parseJsonObject(content) || {};
      const correct = parsed.correct === true || parsed.correct === "true" ? true : (parsed.correct === "partial" ? "partial" : false);
      sendJson(res, 200, {
        correct,
        score: typeof parsed.score === "number" ? Math.max(0, Math.min(1, parsed.score)) : (correct === true ? 1 : (correct === "partial" ? 0.5 : 0)),
        feedback: String(parsed.feedback || "").slice(0, 300),
        summary: String(parsed.summary || "").slice(0, 100)
      });
    } catch (error) {
      console.error("Guided check error:", error.message);
      sendJson(res, 200, { correct: "unknown", score: 0, feedback: "助教暂时无法连接，无法评判这道小检查。你可以对照参考答案自查，或稍后重试。", pending: true });
    }
    return;
  }

  const relationshipsMatch = url.pathname.match(/^\/api\/knowledge\/([^/]+)\/relationships$/);
  if (req.method === "GET" && relationshipsMatch) {
    const id = decodeURIComponent(relationshipsMatch[1]);
    const entry = db.entries.find((item) => item.id === id);
    if (!entry) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }
    sendJson(res, 200, {
      id,
      relationships: Array.isArray(entry.relationships) ? entry.relationships : []
    });
    return;
  }

  if (req.method === "POST" && relationshipsMatch) {
    const id = decodeURIComponent(relationshipsMatch[1]);
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }

    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const relationship = sanitizeRelationship(payload, db);
    const current = db.entries[index];
    const relationships = Array.isArray(current.relationships) ? current.relationships : [];
    const existingIndex = relationships.findIndex((item) => (
      item.predicate === relationship.predicate &&
      item.target === relationship.target &&
      item.targetLabel === relationship.targetLabel
    ));

    if (existingIndex >= 0) relationships[existingIndex] = { ...relationships[existingIndex], ...relationship };
    else relationships.push(relationship);

    const updated = {
      ...current,
      relationships,
      related: uniqueStrings([
        ...normalizeArray(current.related),
        relationship.target
      ]),
      updatedAt: new Date().toISOString()
    };
    updated.searchText = buildSearchText(updated);
    db.entries[index] = updated;
    writeDb(db);
    sendJson(res, existingIndex >= 0 ? 200 : 201, {
      entry: updated,
      relationship
    });
    return;
  }

  const exportMdMatch = url.pathname.match(/^\/api\/knowledge\/([^/]+)\/export-md$/);
  if (req.method === "GET" && exportMdMatch) {
    const id = decodeURIComponent(exportMdMatch[1]);
    const mode = (url.searchParams.get("mode") || "light").trim();
    const entry = db.entries.find((item) => item.id === id);
    if (!entry) { sendJson(res, 404, { error: "Knowledge entry not found" }); return; }
    const tm = typeMeta[entry.type] || entry.type;
    const sm = entry.status || "draft";
    const lines = [];
    lines.push(`# [${tm}] ${entry.title}`);
    lines.push(`> ${entry.summary || "（无摘要）"}`);
    lines.push("");
    lines.push(`**状态**: ${sm}`);
    const kw = normalizeArray(entry.keywords);
    if (kw.length) lines.push(`**关键词**: ${kw.join(", ")}`);
    const au = normalizeArray(entry.audience);
    if (au.length) lines.push(`**适用对象**: ${au.join(", ")}`);
    lines.push("");
    const concepts = normalizeArray(entry.concepts);
    if (concepts.length) {
      lines.push("## 核心概念");
      concepts.forEach(c => lines.push(`- ${c}`));
      lines.push("");
    }
    const skills = normalizeArray(entry.skills);
    if (skills.length) {
      lines.push("## 核心技能");
      skills.forEach(s => lines.push(`- ${s}`));
      lines.push("");
    }
    if (mode === "full") {
      const deliverables = normalizeArray(entry.deliverables);
      if (deliverables.length) {
        lines.push("## 交付物");
        deliverables.forEach(d => lines.push(`- ${d}`));
        lines.push("");
      }
      if (Array.isArray(entry.chunks) && entry.chunks.length) {
        lines.push("## 原文段落");
        entry.chunks.forEach(c => {
          const prefix = c.type === "heading" ? "### " : "";
          lines.push(`${prefix}${c.text}`);
          lines.push("");
        });
      }
      const rels = Array.isArray(entry.relationships) ? entry.relationships : [];
      if (rels.length) {
        lines.push("## 知识关系");
        rels.forEach(r => {
          const target = r.target ? db.entries.find(e => e.id === r.target) : null;
          const targetLabel = target ? target.title : (r.targetLabel || r.target || "未知");
          lines.push(`- ${graphRelationLabel(r.predicate)} → ${targetLabel}`);
        });
        lines.push("");
      }
      const auditLog = Array.isArray(entry.auditLog) ? entry.auditLog : [];
      if (auditLog.length) {
        lines.push("## 审计记录");
        auditLog.forEach(log => {
          const ts = log.timestamp ? new Date(log.timestamp).toLocaleString("zh-CN") : "";
          const note = log.note ? ` — ${log.note}` : "";
          if (log.action === "transition") lines.push(`- ${ts} **${log.from} → ${log.to}**${note}`);
          else if (log.action === "approved") lines.push(`- ${ts} **✓ 通过**: review → stable${note}`);
          else if (log.action === "rejected") lines.push(`- ${ts} **✗ 驳回**: review → draft${note}`);
          else lines.push(`- ${ts} ${log.action}${note}`);
        });
        lines.push("");
      }
      lines.push(`---\n*导出时间: ${new Date().toLocaleString("zh-CN")} · 条目 ID: ${entry.id}*`);
    }
    sendText(res, 200, lines.join("\n"));
    return;
  }

  const detailMatch = url.pathname.match(/^\/api\/knowledge\/([^/]+)$/);
  if (req.method === "GET" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    const entry = db.entries.find((item) => item.id === id);
    if (!entry) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }
    sendJson(res, 200, entry);
    return;
  }

  if (req.method === "PATCH" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }

    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    if (payload.keywords !== undefined) {
      const kw = normalizeArray(payload.keywords);
      if (kw.length < 3) return sendJson(res, 400, { error: "关键词至少 3 个" });
    }
    if (payload.audience !== undefined) {
      const au = normalizeArray(payload.audience);
      if (au.length < 1) return sendJson(res, 400, { error: "适用对象至少 1 个" });
    }
    const current = db.entries[index];
    const updated = {
      ...current,
      title: payload.title !== undefined ? String(payload.title || current.title).trim() : current.title,
      type: payload.type !== undefined ? String(payload.type || current.type).trim() : current.type,
      status: payload.status !== undefined ? normalizeStatus(payload.status, current.status) : current.status,
      audience: payload.audience !== undefined ? normalizeArray(payload.audience) : normalizeArray(current.audience),
      tags: payload.tags !== undefined ? normalizeArray(payload.tags) : normalizeArray(current.tags),
      keywords: payload.keywords !== undefined ? normalizeArray(payload.keywords) : normalizeArray(current.keywords),
      concepts: payload.concepts !== undefined ? normalizeArray(payload.concepts) : normalizeArray(current.concepts),
      skills: payload.skills !== undefined ? normalizeArray(payload.skills) : normalizeArray(current.skills),
      deliverables: payload.deliverables !== undefined ? normalizeArray(payload.deliverables) : normalizeArray(current.deliverables),
      related: payload.related !== undefined ? normalizeArray(payload.related) : normalizeArray(current.related),
      relationships: Array.isArray(payload.relationships) ? normalizeRelationships(payload.relationships, [], db) : (Array.isArray(current.relationships) ? current.relationships : []),
      summary: payload.summary !== undefined ? String(payload.summary || "") : current.summary,
      situation: payload.situation !== undefined ? String(payload.situation || "") : current.situation,
      ontology: payload.ontology !== undefined ? String(payload.ontology || "") : current.ontology,
      workflow: payload.workflow !== undefined ? String(payload.workflow || "") : current.workflow,
      skill: payload.skill !== undefined ? String(payload.skill || "") : current.skill,
      evaluation: payload.evaluation !== undefined ? String(payload.evaluation || "") : current.evaluation,
      knowledgeGrowth: payload.knowledgeGrowth !== undefined ? String(payload.knowledgeGrowth || "") : current.knowledgeGrowth,
      knowledgeProcessing: payload.knowledgeProcessing !== undefined ? normalizeKnowledgeProcessing(payload.knowledgeProcessing, current.knowledgeProcessing) : normalizeKnowledgeProcessing(current.knowledgeProcessing),
      archivedAt: payload.status === "archived" ? (current.archivedAt || new Date().toISOString()) : (payload.status && payload.status !== "archived" ? null : current.archivedAt),
      updatedAt: new Date().toISOString()
    };

    updated.searchText = buildSearchText(updated);
    db.entries[index] = updated;
    writeDb(db);
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === "DELETE" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }

    const archived = {
      ...db.entries[index],
      status: "archived",
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    archived.searchText = buildSearchText(archived);
    db.entries[index] = archived;
    writeDb(db);
    sendJson(res, 200, {
      archived: {
        id: archived.id,
        title: archived.title,
        type: archived.type,
        status: archived.status
      },
      countDelta: 0,
      remaining: visibleEntries(db.entries).length
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/knowledge") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const title = (payload.title || "").trim();
    const summary = (payload.summary || "").trim();
    const keywords = Array.isArray(payload.keywords) ? payload.keywords.filter(Boolean) : [];
    if (!title) return sendJson(res, 400, { error: "标题不能为空" });
    if (!summary) return sendJson(res, 400, { error: "摘要不能为空" });
    if (keywords.length < 3) return sendJson(res, 400, { error: "关键词至少 3 个" });
    const entry = sanitizeEntry(payload);
    const existingIndex = db.entries.findIndex((item) => item.id === entry.id);

    if (existingIndex >= 0) db.entries[existingIndex] = entry;
    else db.entries.push(entry);

    writeDb(db);
    sendJson(res, existingIndex >= 0 ? 200 : 201, entry);
    return;
  }

  const knowledgeIdMatch = url.pathname.match(/^\/api\/knowledge\/([^/]+)$/);
  const knowledgeActionMatch = url.pathname.match(/^\/api\/knowledge\/([^/]+)\/(transition|review|audit-log|revisions)$/);

  if (req.method === "PATCH" && knowledgeIdMatch) {
    const id = decodeURIComponent(knowledgeIdMatch[1]);
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) { sendJson(res, 404, { error: "条目未找到" }); return; }
    const updated = { ...db.entries[index] };
    for (const key of ["title","summary","keywords","concepts","skills","deliverables","audience","tags","status","situation","ontology","workflow","evaluation","knowledgeGrowth","agentNotes"]) {
      if (payload[key] !== undefined) updated[key] = payload[key];
    }
    if (payload.keywords && Array.isArray(payload.keywords) && payload.keywords.filter(Boolean).length < 3) { sendJson(res, 400, { error: "关键词至少 3 个" }); return; }
    if (payload.audience && Array.isArray(payload.audience) && payload.audience.filter(Boolean).length < 1) { sendJson(res, 400, { error: "至少 1 个适用对象" }); return; }
    updated.updatedAt = new Date().toISOString();
    db.entries[index] = updated;
    writeDb(db);
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === "POST" && knowledgeActionMatch && knowledgeActionMatch[2] === "transition") {
    const id = decodeURIComponent(knowledgeActionMatch[1]);
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const targetStatus = String(payload.status || "").trim();
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) { sendJson(res, 404, { error: "条目未找到" }); return; }
    const entry = db.entries[index];
    const current = entry.status || "draft";
    // 状态流转规则，对齐 DESIGN 8.3 定义的 draft/review/stable/sample/deprecated（+archived 归档）
    const validTransitions = {
      draft:      ["review"],
      review:     ["stable", "draft"],
      stable:     ["deprecated", "archived", "draft"],
      sample:     ["review", "deprecated", "archived", "draft"],
      deprecated: ["draft", "archived"],
      archived:   ["draft"]
    };
    const allowed = validTransitions[current] || [];
    if (!allowed.includes(targetStatus)) {
      sendJson(res, 400, { error: "不允许的状态转换: " + current + " → " + targetStatus + "（允许: " + allowed.join(", ") + "）" });
      return;
    }
    if (targetStatus === "review") {
      const kw = normalizeArray(entry.keywords);
      const au = normalizeArray(entry.audience);
      if (kw.length < 3) { sendJson(res, 400, { error: "进入 review 需要至少 3 个关键词" }); return; }
      if (au.length < 1) { sendJson(res, 400, { error: "进入 review 需要至少 1 个适用对象" }); return; }
      if (!entry.summary) { sendJson(res, 400, { error: "进入 review 需要填写摘要" }); return; }
    }
    const auditLog = Array.isArray(entry.auditLog) ? entry.auditLog.slice() : [];
    auditLog.push({
      action: "transition",
      from: current,
      to: targetStatus,
      note: payload.note || "",
      timestamp: new Date().toISOString()
    });
    while (auditLog.length > 50) auditLog.shift();
    entry.status = targetStatus;
    entry.auditLog = auditLog;
    entry.updatedAt = new Date().toISOString();
    db.entries[index] = entry;
    writeDb(db);
    sendJson(res, 200, { status: targetStatus, auditLog: auditLog.slice(-1) });
    return;
  }

  if (req.method === "POST" && knowledgeActionMatch && knowledgeActionMatch[2] === "review") {
    const id = decodeURIComponent(knowledgeActionMatch[1]);
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const decision = String(payload.decision || "").trim();
    if (decision !== "approve" && decision !== "reject") { sendJson(res, 400, { error: "decision 必须为 approve 或 reject" }); return; }
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) { sendJson(res, 404, { error: "条目未找到" }); return; }
    const entry = db.entries[index];
    if (entry.status !== "review") { sendJson(res, 400, { error: "仅 review 状态的条目可以审核" }); return; }
    const targetStatus = decision === "approve" ? "stable" : "draft";
    const auditLog = Array.isArray(entry.auditLog) ? entry.auditLog.slice() : [];
    auditLog.push({
      action: decision === "approve" ? "approved" : "rejected",
      from: "review",
      to: targetStatus,
      note: payload.note || "",
      timestamp: new Date().toISOString()
    });
    while (auditLog.length > 50) auditLog.shift();
    entry.status = targetStatus;
    entry.auditLog = auditLog;
    entry.updatedAt = new Date().toISOString();
    db.entries[index] = entry;
    writeDb(db);
    sendJson(res, 200, { status: targetStatus, decision, auditLog: auditLog.slice(-1) });
    return;
  }

  if (req.method === "GET" && knowledgeActionMatch && knowledgeActionMatch[2] === "audit-log") {
    const id = decodeURIComponent(knowledgeActionMatch[1]);
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) { sendJson(res, 404, { error: "条目未找到" }); return; }
    const entry = db.entries[index];
    sendJson(res, 200, { auditLog: Array.isArray(entry.auditLog) ? entry.auditLog : [] });
    return;
  }

  // 修订历史（DESIGN 9.2 knowledge_revisions）：每次内容变化的快照，新 -> 旧
  if (req.method === "GET" && knowledgeActionMatch && knowledgeActionMatch[2] === "revisions") {
    const id = decodeURIComponent(knowledgeActionMatch[1]);
    const exists = db.entries.some((item) => item.id === id);
    if (!exists) { sendJson(res, 404, { error: "条目未找到" }); return; }
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
    const revisions = getStore().listRevisions(id, limit);
    sendJson(res, 200, { id, count: revisions.length, revisions });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    sendJson(res, 201, await createUploadDraft(payload));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload/start") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const jobId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job = {
      id: jobId,
      status: "queued",
      progress: 52,
      phase: "queued",
      detail: "文件已上传，等待后端处理",
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    uploadJobs.set(jobId, job);
    setTimeout(() => runUploadJob(job, payload), 0).unref?.();
    sendJson(res, 202, { job: publicUploadJob(job) });
    return;
  }

  const uploadJobMatch = url.pathname.match(/^\/api\/upload-jobs\/([^/]+)$/);
  if (req.method === "GET" && uploadJobMatch) {
    const job = uploadJobs.get(decodeURIComponent(uploadJobMatch[1]));
    if (!job) {
      sendJson(res, 404, { error: "Upload job not found" });
      return;
    }
    sendJson(res, 200, { job: publicUploadJob(job) });
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);

  if (url.pathname.startsWith("/uploads/")) {
    serveUpload(req, res, url.pathname);
    return;
  }

  if (!url.pathname.startsWith("/api/")) {
    serveStatic(req, res, url.pathname);
    return;
  }

  handleApi(req, res, url).catch((error) => {
    sendJson(res, error.statusCode || 500, { error: error.message || "Internal server error" });
  });
});

server.listen(port, () => {
  try {
    const db = readDb();
    if (migrateAllEntries(db)) {
      console.log(`Migrated static entries with original text (${db.entries.filter(e => e.extractedText).length}/${db.entries.length} entries have original text).`);
    }
  } catch {}
  console.log(`NSEAP Knowledge Base MVP running at http://127.0.0.1:${port}`);
});
